import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { EntityTable, type TableColumn } from '@/components/resource-kit/entity-table'
import { Badge } from '@/components/ui/badge'
import type { Meeting, Profile } from '@/types'

const BASE = '/internal/meetings'
const TEAM_CALENDAR_HREF = '/internal/meetings?calendar=team'
const MY_CALENDAR_HREF = '/internal/meetings?calendar=my'

type CalendarFilter = 'team' | 'my'
type MeetingRow = Meeting & { ownerLabel: string }

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function filterLabel(filter: CalendarFilter) {
  return filter === 'my' ? 'My Calendar' : 'Team Calendar'
}

function filterHref(filter: CalendarFilter) {
  return filter === 'my' ? MY_CALENDAR_HREF : TEAM_CALENDAR_HREF
}

const TABLE_COLUMNS: TableColumn<MeetingRow>[] = [
  { key: 'title', label: 'Meeting', render: row => row.title },
  { key: 'scheduled_at', label: 'When', width: '150px', render: row => formatDateTime(row.scheduled_at) },
  { key: 'owner_id', label: 'Owner', width: '160px', render: row => row.ownerLabel },
  { key: 'duration_minutes', label: 'Duration', width: '90px', render: row => `${row.duration_minutes}m` },
  { key: 'status', label: 'Status', width: '120px', render: row => <ResourceStatusBadge status={row.status} /> },
  { key: 'next_action', label: 'Next Action', render: row => <span className="line-clamp-1">{row.next_action || row.agenda || '-'}</span> },
]

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ calendar?: string }>
}) {
  const params = await searchParams
  const calendar: CalendarFilter = params.calendar === 'my' ? 'my' : 'team'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: meetings }, { data: profiles }] = await Promise.all([
    supabase.from('meetings').select('*').order('scheduled_at', { ascending: true }),
    supabase.from('profiles').select('id, email, full_name').in('role', ['admin', 'employee']),
  ])

  const profileRows = (profiles ?? []) as Pick<Profile, 'id' | 'email' | 'full_name'>[]
  const ownerById = new Map(profileRows.map(profile => [profile.id, profile.full_name || profile.email]))
  const currentEmail = user?.email?.toLowerCase() ?? ''
  const rows = ((meetings ?? []) as Meeting[])
    .filter(row => {
      if (calendar === 'team') return true
      const attendeeEmails = (row.attendees ?? []).map(attendee => attendee.toLowerCase())
      return row.owner_id === user?.id || attendeeEmails.includes(currentEmail)
    })
    .map(row => ({
      ...row,
      ownerLabel: row.owner_id ? ownerById.get(row.owner_id) ?? 'Unassigned' : 'Unassigned',
    }))

  return (
    <div className="space-y-5">
      <ResourcePageHeader title="Meetings" description={`${filterLabel(calendar)} for discovery calls, proposal reviews, and delivery check-ins`} newHref={`${BASE}/new`} newLabel="New Meeting" />

      <div className="flex flex-wrap items-center gap-2">
        <Link href={filterHref('team')} className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted">
          Team Calendar
        </Link>
        <Link href={filterHref('my')} className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted">
          My Calendar
        </Link>
        <Badge variant="outline">{rows.length} {rows.length === 1 ? 'meeting' : 'meetings'}</Badge>
      </div>

      {rows.length === 0 ? (
        <ResourceEmptyState
          showAll={false}
          basePath={BASE}
          title={`No ${filterLabel(calendar).toLowerCase()} meetings`}
          description="Schedule the first-party meeting here before relying on external calendar sync."
          actionLabel="New Meeting"
          actionHref={`${BASE}/new`}
        />
      ) : (
        <EntityTable rows={rows} columns={TABLE_COLUMNS} getHref={row => `${BASE}/${row.id}`} />
      )}
    </div>
  )
}
