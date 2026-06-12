import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceViewTabs } from '@/components/resource-kit/resource-view-tabs'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { ViewToggle } from '@/components/resource-kit/view-toggle'
import { EntityTable, type TableColumn } from '@/components/resource-kit/entity-table'
import { EntityBoard, type BoardCard, type BoardColumn } from '@/components/resource-kit/entity-board'
import { Badge } from '@/components/ui/badge'
import type { Deal } from '@/types'

const BASE = '/internal/deals'

const BOARD_COLUMNS: BoardColumn[] = [
  { status: 'qualifying', label: 'Qualifying' },
  { status: 'proposal', label: 'Proposal' },
  { status: 'negotiation', label: 'Negotiation' },
  { status: 'won', label: 'Won' },
  { status: 'on_hold', label: 'On Hold' },
]

const TABLE_COLUMNS: TableColumn<Deal>[] = [
  { key: 'name', label: 'Deal', render: row => row.name },
  { key: 'estimated_value', label: 'Value', width: '110px', render: row => row.estimated_value != null ? row.estimated_value.toLocaleString() : <span className="text-muted-foreground/40">-</span> },
  { key: 'expected_close_date', label: 'Close', width: '110px', render: row => row.expected_close_date || <span className="text-muted-foreground/40">-</span> },
  { key: 'stage', label: 'Stage', width: '140px', render: row => <ResourceStatusBadge status={row.stage} /> },
  { key: 'next_step', label: 'Next Step', render: row => <span className="line-clamp-1">{row.next_step || '-'}</span> },
]

export default async function DealsPage({ searchParams }: { searchParams: Promise<{ view?: string; layout?: string }> }) {
  const { view, layout } = await searchParams
  const showAll = view === 'all'
  const isBoard = layout === 'board'
  const supabase = await createClient()

  let query = supabase.from('deals').select('*').order('created_at', { ascending: false })
  if (!showAll) query = query.not('stage', 'in', '("lost")')
  const { data } = await query
  const rows = (data ?? []) as Deal[]

  const boardCards: BoardCard[] = rows.map(row => ({
    id: row.id,
    href: `${BASE}/${row.id}`,
    primary: row.name,
    secondary: row.next_step || (row.estimated_value != null ? row.estimated_value.toLocaleString() : undefined),
    status: row.stage,
  }))

  return (
    <div className="space-y-5">
      <ResourcePageHeader title="Deals" description="Qualified opportunities between leads and proposals" newHref={`${BASE}/new`} newLabel="New Deal" />
      <div className="flex items-center justify-between">
        <ResourceViewTabs basePath={BASE} showAll={showAll} layout={isBoard ? 'board' : 'table'} />
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">{rows.length} open</Badge>
          <ViewToggle basePath={BASE} layout={isBoard ? 'board' : 'table'} showAll={showAll} />
        </div>
      </div>
      {rows.length === 0 ? (
        <ResourceEmptyState showAll={showAll} basePath={BASE} />
      ) : isBoard ? (
        <EntityBoard columns={showAll ? [...BOARD_COLUMNS, { status: 'lost', label: 'Lost' }] : BOARD_COLUMNS} cards={boardCards} />
      ) : (
        <EntityTable rows={rows} columns={TABLE_COLUMNS} getHref={row => `${BASE}/${row.id}`} />
      )}
    </div>
  )
}
