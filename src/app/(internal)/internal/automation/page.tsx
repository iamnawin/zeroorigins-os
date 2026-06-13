import Link from 'next/link'
import { AlertTriangle, CalendarSync, MailCheck, PlayCircle, Send, Workflow } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import type { AiAssistRequest, Meeting } from '@/types'

export default async function AutomationPage() {
  const supabase = await createClient()
  const [{ data: aiRequests }, { data: meetings }, { data: applications }, { data: ideas }, { data: sources }] = await Promise.all([
    supabase.from('ai_assist_requests').select('*').order('created_at', { ascending: false }).limit(8),
    supabase.from('meetings').select('*').order('scheduled_at', { ascending: false }).limit(8),
    supabase.from('applications').select('id, last_synced_at, status').order('last_synced_at', { ascending: false, nullsFirst: false }).limit(250),
    supabase.from('business_ideas').select('id, source, updated_at').limit(250),
    supabase.from('source_registry').select('id, last_synced_at, status').order('last_synced_at', { ascending: false, nullsFirst: false }).limit(250),
  ])
  const requests = (aiRequests ?? []) as AiAssistRequest[]
  const syncedMeetings = ((meetings ?? []) as Meeting[]).filter(row => row.source === 'google_calendar')
  const failedRequests = requests.filter(row => row.status === 'failed')
  const workspaceStats = getWorkspaceSyncStats(
    (applications ?? []) as { last_synced_at?: string | null; status?: string | null }[],
    (ideas ?? []) as { source?: string | null }[],
    (sources ?? []) as { last_synced_at?: string | null; status?: string | null }[],
  )

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-zo-purple-2">Automation</p>
        <h1 className="mt-1 text-2xl font-bold">Automation visibility</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Email Router, Telegram alerts, Calendar Sync, local workspace source sync, AI Assist activity, and failures that need review.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <AutomationCard
          title="Email Router"
          icon={MailCheck}
          status="ready"
          lines={['Connected inbox: Gmail / n8n', 'Last email processed: waiting for event', 'Last AI category: none yet', 'Manual review: 0']}
          action="Run Email Router Test"
          href="/internal/automation?tab=email-router"
        />
        <AutomationCard
          title="Telegram Alerts"
          icon={Send}
          status="ready"
          lines={['Alert bot: configured in n8n', 'Last alert status: waiting', 'Failures requiring review: 0']}
          action="Open Alert Logs"
          href="/internal/automation?tab=telegram-alerts"
        />
        <AutomationCard
          title="Calendar Sync"
          icon={CalendarSync}
          status={syncedMeetings.length > 0 ? 'ready' : 'not_connected'}
          lines={['Google Calendar: connect from Settings', `Recent synced meetings: ${syncedMeetings.length}`, 'Manual button: Meetings -> Sync Now']}
          action="Sync Google Calendar"
          href="/internal/meetings?calendar=team"
        />
        <AutomationCard
          title="Workspace Source Sync"
          icon={Workflow}
          status={workspaceStats.neverSyncedApps > 0 ? 'paused' : 'ready'}
          lines={[
            'Mode: Manual local scan',
            'Schedule: No scheduler configured',
            `Last app sync: ${workspaceStats.lastAppSync}`,
            `Last source sync: ${workspaceStats.lastSourceSync}`,
            `Applications tracked: ${workspaceStats.totalApps}`,
            `Ideas tracked: ${workspaceStats.totalIdeas}`,
            `Never-synced apps: ${workspaceStats.neverSyncedApps}`,
            'Run: npm run scan:workspace',
            'Then: npm run import:workspace',
          ]}
          action="View Application Registry"
          href="/internal/applications"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Workflow className="h-4 w-4 text-zo-purple" />Automation Logs</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {requests.map(row => (
              <div key={row.id} className="grid gap-3 rounded-md border border-border bg-background/60 p-3 md:grid-cols-[8rem_1fr_7rem_9rem] md:items-center">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">AI Assist</p>
                <p className="truncate text-sm">{row.intent.replace(/_/g, ' ')}</p>
                <ResourceStatusBadge status={row.status} />
                <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</p>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="rounded-md border border-dashed border-border p-6 text-center">
                <p className="text-sm font-semibold">No automation logs yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">Run Email Router Test or create an AI Assist draft.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-zo-purple" />Needs Review</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {failedRequests.map(row => (
              <div key={row.id} className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
                <p className="text-sm font-semibold">{row.intent.replace(/_/g, ' ')}</p>
                <p className="mt-1 text-xs text-muted-foreground">{row.error_message || 'AI output failed and needs review.'}</p>
              </div>
            ))}
            {failedRequests.length === 0 && <p className="text-sm text-muted-foreground">No failed AI outputs requiring review.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getWorkspaceSyncStats(
  applications: { last_synced_at?: string | null; status?: string | null }[],
  ideas: { source?: string | null }[],
  sources: { last_synced_at?: string | null; status?: string | null }[],
) {
  const activeApps = applications.filter(row => row.status !== 'archived')
  const activeSources = sources.filter(row => row.status !== 'archived')

  return {
    totalApps: activeApps.length,
    totalIdeas: ideas.length,
    neverSyncedApps: activeApps.filter(row => !row.last_synced_at).length,
    localIdeas: ideas.filter(row => row.source === 'local_folder').length,
    lastAppSync: formatSyncTime(latestTimestamp(activeApps.map(row => row.last_synced_at))),
    lastSourceSync: formatSyncTime(latestTimestamp(activeSources.map(row => row.last_synced_at))),
  }
}

function latestTimestamp(values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
}

function formatSyncTime(value?: string) {
  if (!value) return 'Never'
  return new Date(value).toLocaleString()
}

function AutomationCard({ title, icon: Icon, status, lines, action, href }: { title: string; icon: typeof Workflow; status: string; lines: string[]; action: string; href: string }) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Icon className="h-5 w-5 text-zo-purple" />
          <ResourceStatusBadge status={status} />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {lines.map(line => <p key={line} className="text-sm text-muted-foreground">{line}</p>)}
        </div>
        <Link href={href}><Button size="sm" variant="outline" className="w-full"><PlayCircle className="mr-1 h-4 w-4" />{action}</Button></Link>
      </CardContent>
    </Card>
  )
}
