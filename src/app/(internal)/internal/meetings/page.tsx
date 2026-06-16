import Link from 'next/link'
import { CalendarPlus, CalendarSync } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { EntityTable, type TableColumn } from '@/components/resource-kit/entity-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Meeting, Profile } from '@/types'
import { SyncCalendarButton } from '@/components/calendar/sync-calendar-button'

const BASE = '/internal/meetings'

type CalendarFilter = 'all' | 'team' | 'my'
type MeetingRow = Meeting & { ownerLabel: string }

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function filterLabel(filter: CalendarFilter) {
  if (filter === 'all') return 'All Teams'
  return filter === 'my' ? 'My Calendar' : 'Team Calendar'
}

const TABLE_COLUMNS: TableColumn<MeetingRow>[] = [
  { key: 'title', label: 'Meeting', render: row => row.title },
  { key: 'scheduled_at', label: 'When', width: '150px', render: row => formatDateTime(row.scheduled_at) },
  { key: 'owner_id', label: 'Owner', width: '160px', render: row => row.ownerLabel },
  { key: 'source', label: 'Source', width: '130px', render: row => <Badge variant="outline">{row.source === 'google_calendar' ? 'Google' : 'Manual'}</Badge> },
  { key: 'duration_minutes', label: 'Duration', width: '90px', render: row => `${row.duration_minutes}m` },
  { key: 'status', label: 'Status', width: '120px', render: row => <ResourceStatusBadge status={row.status} /> },
  { key: 'next_action', label: 'Next Action', render: row => <span className="line-clamp-1">{row.next_action || row.agenda || '-'}</span> },
]

/** Deduplicate meetings by calendar_event_id — keep earliest-created row per event */
function deduplicateMeetings(meetings: Meeting[]): Meeting[] {
  const seen = new Map<string, Meeting>()
  const result: Meeting[] = []

  for (const m of meetings) {
    if (!m.calendar_event_id) {
      result.push(m)
      continue
    }
    const existing = seen.get(m.calendar_event_id)
    if (!existing) {
      seen.set(m.calendar_event_id, m)
      result.push(m)
    }
    // skip duplicates — keep the first one (earliest by scheduled_at order)
  }
  return result
}

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ calendar?: string }>
}) {
  const params = await searchParams
  const calendar: CalendarFilter = params.calendar === 'my' ? 'my' : params.calendar === 'all' ? 'all' : 'team'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: meetings }, { data: profiles }, { data: currentProfile }] = await Promise.all([
    supabase.from('meetings').select('*').order('scheduled_at', { ascending: true }),
    supabase.from('profiles').select('id, email, full_name, role').in('role', ['admin', 'employee']),
    supabase.from('profiles').select('role').eq('id', user?.id || '').single(),
  ])

  const isAdmin = currentProfile?.role === 'admin'
  const profileRows = (profiles ?? []) as Pick<Profile, 'id' | 'email' | 'full_name'>[]
  const ownerById = new Map(profileRows.map(profile => [profile.id, profile.full_name || profile.email]))
  const currentEmail = user?.email?.toLowerCase() ?? ''

  let filtered = (meetings ?? []) as Meeting[]

  if (calendar === 'my') {
    filtered = filtered.filter(row => {
      const attendeeEmails = (row.attendees ?? []).map(a => a.toLowerCase())
      return row.owner_id === user?.id || attendeeEmails.includes(currentEmail)
    })
  } else if (calendar === 'all') {
    // Admin: all meetings, deduplicated by calendar_event_id
    filtered = deduplicateMeetings(filtered)
  }
  // 'team' = show all without dedup (same person's meetings)

  const rows: MeetingRow[] = filtered.map(row => ({
    ...row,
    ownerLabel: row.owner_id ? ownerById.get(row.owner_id) ?? 'Unassigned' : 'Unassigned',
  }))

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <ResourcePageHeader title="Meetings" description={`${filterLabel(calendar)} for discovery calls, proposal reviews, synced Google events, and delivery check-ins`} showNew={false} />
        <div className="flex flex-wrap gap-2">
          <Link href={`${BASE}/new`}><Button size="sm"><CalendarPlus className="mr-1 h-4 w-4" />Add Meeting</Button></Link>
          <Link href="/api/auth/google"><Button size="sm" variant="outline"><CalendarSync className="mr-1 h-4 w-4" />Connect Google</Button></Link>
          <SyncCalendarButton />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isAdmin && (
          <Link href={`${BASE}?calendar=all`} className={`rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted ${calendar === 'all' ? 'bg-muted font-medium' : ''}`}>
            All Teams
          </Link>
        )}
        <Link href={`${BASE}?calendar=team`} className={`rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted ${calendar === 'team' ? 'bg-muted font-medium' : ''}`}>
          Team Calendar
        </Link>
        <Link href={`${BASE}?calendar=my`} className={`rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted ${calendar === 'my' ? 'bg-muted font-medium' : ''}`}>
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
