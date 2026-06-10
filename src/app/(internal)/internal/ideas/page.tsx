import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceViewTabs } from '@/components/resource-kit/resource-view-tabs'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { ViewToggle } from '@/components/resource-kit/view-toggle'
import { EntityTable, type TableColumn } from '@/components/resource-kit/entity-table'
import { EntityBoard, type BoardCard, type BoardColumn } from '@/components/resource-kit/entity-board'
import { terminalStatusFilter } from '@/lib/resource-kit/status'
import { Badge } from '@/components/ui/badge'
import type { Idea } from '@/types'

const BASE = '/internal/ideas'

const BOARD_COLUMNS: BoardColumn[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'submitted', label: 'Submitted' },
  { status: 'under_review', label: 'Under Review' },
  { status: 'approved', label: 'Approved' },
  { status: 'on_hold', label: 'On Hold' },
  { status: 'converted_to_project', label: 'Converted' },
]

// Terminal statuses only have board columns in the All view
const CLOSED_BOARD_COLUMNS: BoardColumn[] = [
  { status: 'rejected', label: 'Rejected' },
  { status: 'archived', label: 'Archived' },
]

const TABLE_COLUMNS: TableColumn<Idea>[] = [
  { key: 'title', label: 'Title', render: r => r.title },
  { key: 'description', label: 'Description', width: '40%', render: r => <span className="line-clamp-1 text-muted-foreground">{r.description}</span> },
  { key: 'priority', label: 'Priority', width: '90px', render: r => r.priority ? <Badge variant="outline" className="text-[10px]">{r.priority}</Badge> : <span className="text-muted-foreground/40">—</span> },
  { key: 'status', label: 'Status', width: '140px', render: r => <ResourceStatusBadge status={r.status} /> },
  { key: 'created_at', label: 'Created', width: '100px', render: r => <span>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> },
]

export default async function IdeasPage({ searchParams }: { searchParams: Promise<{ view?: string; layout?: string }> }) {
  const { view, layout } = await searchParams
  const showAll = view === 'all'
  const isBoard = layout === 'board'

  const supabase = await createClient()
  let query = supabase.from('ideas').select('*').order('created_at', { ascending: false })
  if (!showAll) query = query.not('status', 'in', terminalStatusFilter('ideas'))
  const { data: ideas } = await query
  const rows = (ideas ?? []) as Idea[]

  const boardCards: BoardCard[] = rows.map(r => ({
    id: r.id,
    href: `${BASE}/${r.id}`,
    primary: r.title,
    secondary: r.priority ?? undefined,
    status: r.status,
  }))

  return (
    <div className="space-y-5">
      <ResourcePageHeader title="Ideas" description="Capture and review ideas before execution" newHref={`${BASE}/new`} newLabel="New Idea" />
      <div className="flex items-center justify-between">
        <ResourceViewTabs basePath={BASE} showAll={showAll} layout={isBoard ? 'board' : 'table'} />
        <ViewToggle basePath={BASE} layout={isBoard ? 'board' : 'table'} showAll={showAll} />
      </div>
      {rows.length === 0 ? (
        <ResourceEmptyState showAll={showAll} basePath={BASE} />
      ) : isBoard ? (
        <EntityBoard columns={showAll ? [...BOARD_COLUMNS, ...CLOSED_BOARD_COLUMNS] : BOARD_COLUMNS} cards={boardCards} />
      ) : (
        <EntityTable rows={rows} columns={TABLE_COLUMNS} getHref={r => `${BASE}/${r.id}`} />
      )}
    </div>
  )
}
