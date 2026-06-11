import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceViewTabs } from '@/components/resource-kit/resource-view-tabs'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { EntityTable, type TableColumn } from '@/components/resource-kit/entity-table'
import { terminalStatusFilter } from '@/lib/resource-kit/status'
import type { Proposal } from '@/types'

const BASE = '/internal/proposals'

const TABLE_COLUMNS: TableColumn<Proposal>[] = [
  { key: 'title', label: 'Title', render: r => r.title },
  { key: 'service_type', label: 'Service', render: r => r.service_type || <span className="text-muted-foreground/40">—</span> },
  { key: 'amount', label: 'Amount', width: '110px', render: r => r.amount != null ? r.amount.toLocaleString() : <span className="text-muted-foreground/40">—</span> },
  { key: 'status', label: 'Status', width: '130px', render: r => <ResourceStatusBadge status={r.status} /> },
  { key: 'sent_at', label: 'Sent', width: '100px', render: r => r.sent_at ? new Date(r.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : <span className="text-muted-foreground/40">—</span> },
  { key: 'created_at', label: 'Created', width: '100px', render: r => <span>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> },
]

export default async function ProposalsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()
  let query = supabase.from('proposals').select('*').order('created_at', { ascending: false })
  if (!showAll) query = query.not('status', 'in', terminalStatusFilter('proposals'))
  const { data: proposals } = await query
  const rows = (proposals ?? []) as Proposal[]

  return (
    <div className="space-y-5">
      <ResourcePageHeader
        title="Proposals"
        description="Draft, send, and track client proposals through to acceptance"
        newHref={`${BASE}/new`}
        newLabel="New Proposal"
      />
      <ResourceViewTabs basePath={BASE} showAll={showAll} />
      {rows.length === 0 ? (
        <ResourceEmptyState showAll={showAll} basePath={BASE} />
      ) : (
        <EntityTable rows={rows} columns={TABLE_COLUMNS} getHref={r => `${BASE}/${r.id}`} />
      )}
    </div>
  )
}
