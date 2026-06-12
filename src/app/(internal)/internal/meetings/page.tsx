import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { EntityTable, type TableColumn } from '@/components/resource-kit/entity-table'
import type { Meeting } from '@/types'

const BASE = '/internal/meetings'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const TABLE_COLUMNS: TableColumn<Meeting>[] = [
  { key: 'title', label: 'Meeting', render: row => row.title },
  { key: 'scheduled_at', label: 'When', width: '150px', render: row => formatDateTime(row.scheduled_at) },
  { key: 'duration_minutes', label: 'Duration', width: '90px', render: row => `${row.duration_minutes}m` },
  { key: 'status', label: 'Status', width: '120px', render: row => <ResourceStatusBadge status={row.status} /> },
  { key: 'next_action', label: 'Next Action', render: row => <span className="line-clamp-1">{row.next_action || row.agenda || '-'}</span> },
]

export default async function MeetingsPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('meetings').select('*').order('scheduled_at', { ascending: true })
  const rows = (data ?? []) as Meeting[]

  return (
    <div className="space-y-5">
      <ResourcePageHeader title="Meetings" description="Discovery calls, proposal reviews, and delivery check-ins" newHref={`${BASE}/new`} newLabel="New Meeting" />
      {rows.length === 0 ? (
        <ResourceEmptyState showAll={false} basePath={BASE} />
      ) : (
        <EntityTable rows={rows} columns={TABLE_COLUMNS} getHref={row => `${BASE}/${row.id}`} />
      )}
    </div>
  )
}
