import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { Badge } from '@/components/ui/badge'
import { SyncSignalActions } from './sync-signal-actions'
import type { SyncSignal, SyncSignalStatus } from '@/types'

const BASE = '/internal/sync-inbox'

const STATUS_TABS: { value: SyncSignalStatus | 'all'; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'needs_review', label: 'Needs Review' },
  { value: 'matched', label: 'Matched' },
  { value: 'created', label: 'Created' },
  { value: 'ignored', label: 'Ignored' },
  { value: 'all', label: 'All' },
]

const PROVIDER_LABELS: Record<string, string> = {
  google_calendar: 'Google Cal',
  google_drive: 'Drive',
  gmail: 'Gmail',
  github: 'GitHub',
  youtube: 'YouTube',
  finance: 'Finance',
  local_folder: 'Local',
  form: 'Form',
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default async function SyncInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const status = (params.status ?? 'new') as SyncSignalStatus | 'all'
  const supabase = await createClient()

  const query = supabase
    .from('sync_signals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data, error } = status === 'all'
    ? await query
    : await query.eq('status', status)

  const signals = (data ?? []) as SyncSignal[]

  const migrationPending = error?.message?.includes('does not exist') || error?.code === '42P01'

  return (
    <div className="space-y-5">
      <ResourcePageHeader
        title="Sync Inbox"
        description="Review external signals before they create records in ZeroOrigins OS."
        showNew={false}
      />

      {/* Status filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map(tab => (
          <Link
            key={tab.value}
            href={`${BASE}?status=${tab.value}`}
            className={[
              'rounded-md border px-3 py-1.5 text-sm transition-colors',
              status === tab.value
                ? 'border-zo-purple bg-zo-purple/10 text-zo-purple font-medium'
                : 'border-border text-muted-foreground hover:bg-muted',
            ].join(' ')}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {migrationPending ? (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-5 text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
          <p className="font-semibold">Migration 019 not yet applied.</p>
          <p className="text-muted-foreground">Paste <code className="text-xs bg-muted px-1 py-0.5 rounded">supabase/migrations/019_sync_signals.sql</code> into the Supabase SQL editor to activate this inbox.</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
          {error.message}
        </div>
      ) : signals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/40 px-6 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            No {status === 'all' ? '' : status.replace('_', ' ')} signals
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Signals appear here when external sources (Google Calendar, Drive, etc.) are synced.
          </p>
        </div>
      ) : (
        <>
          <div className="text-xs text-muted-foreground">{signals.length} signal{signals.length !== 1 ? 's' : ''}</div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Source</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[140px]">When</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[120px]">Type</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[110px]">Status</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[180px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {signals.map(signal => (
                  <tr key={signal.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit text-[10px]">
                          {PROVIDER_LABELS[signal.source_provider] ?? signal.source_provider}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">{signal.source_account}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <span className="block font-medium text-foreground line-clamp-2">{signal.title ?? '-'}</span>
                      {signal.source_url && (
                        <a
                          href={signal.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[11px] text-zo-purple hover:underline mt-0.5 truncate"
                        >
                          Open source ↗
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-[12px]">
                      {formatDate(signal.occurred_at)}
                    </td>
                    <td className="px-4 py-3">
                      {signal.suggested_record_type
                        ? <Badge variant="secondary" className="text-[10px]">{signal.suggested_record_type}</Badge>
                        : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <ResourceStatusBadge status={signal.status} />
                    </td>
                    <td className="px-4 py-3">
                      <SyncSignalActions signal={signal} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
