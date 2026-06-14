import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { Badge } from '@/components/ui/badge'
import { GridReveal, GridRevealItem } from '@/components/ui/grid-reveal'
import { LifecycleBoard } from '@/components/lifecycle/LifecycleBoard'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { Application } from '@/types'
import type { LifecycleApplication, LifecycleIdea } from '@/components/lifecycle/types'

const BASE = '/internal/applications'
type ApplicationCardRow = Application & {
  vertical?: { id: string; name: string } | null
  owner?: { full_name?: string | null; email?: string | null } | null
}

const STAGE_COLORS: Record<string, string> = {
  live: 'border-green-500/40 text-green-400',
  production_ready: 'border-blue-500/40 text-blue-400',
  testing: 'border-yellow-500/40 text-yellow-400',
  prototype: 'border-orange-500/40 text-orange-400',
  concept: 'border-muted-foreground/40 text-muted-foreground',
  paused: 'border-muted-foreground/40 text-muted-foreground',
  archived: 'border-muted-foreground/40 text-muted-foreground',
}

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams

  const supabase = await createClient()
  let query = supabase.from('applications').select('*, vertical:business_verticals(id, name), owner:profiles(full_name, email)').order('name')

  if (filter === 'archived') query = query.eq('status', 'archived')
  else if (filter === 'production_ready') query = query.eq('stage', 'production_ready').neq('status', 'archived')
  else if (filter === 'live') query = query.eq('stage', 'live').neq('status', 'archived')
  else if (filter === 'prototype') query = query.eq('stage', 'prototype').neq('status', 'archived')
  else if (filter === 'missing_repo') query = query.is('repo_url', null).neq('status', 'archived')
  else if (filter === 'missing_local') query = query.is('local_folder_path', null).neq('status', 'archived')
  else if (filter === 'missing_docs') query = query.is('docs_url', null).neq('status', 'archived')
  else if (filter === 'missing_deploy') query = query.is('deployment_url', null).neq('status', 'archived')
  else query = query.neq('status', 'archived')

  const [{ data }, { data: boardApps }, { data: boardIdeas }, { data: verticals }] = await Promise.all([
    query,
    supabase
      .from('applications')
      .select('*, vertical:business_verticals(id, name), owner:profiles(full_name, email), source_idea:business_ideas!applications_source_idea_id_fkey(id, title)')
      .order('updated_at', { ascending: false })
      .limit(250),
    supabase
      .from('business_ideas')
      .select('*, vertical:business_verticals(id, name), owner:profiles(full_name, email), promoted_application:applications!business_ideas_promoted_application_id_fkey(id, name), linked_application:applications!business_ideas_linked_application_id_fkey(id, name)')
      .order('updated_at', { ascending: false })
      .limit(250),
    supabase.from('business_verticals').select('id, name').order('name'),
  ])
  const rows = (data ?? []) as ApplicationCardRow[]

  const filters = [
    { key: '', label: 'All' },
    { key: 'production_ready', label: 'Production Ready' },
    { key: 'live', label: 'Live' },
    { key: 'prototype', label: 'Prototype' },
    { key: 'missing_repo', label: 'Missing Repo' },
    { key: 'missing_local', label: 'Missing Local Folder' },
    { key: 'missing_docs', label: 'Missing Docs' },
    { key: 'missing_deploy', label: 'Missing Deployment' },
    { key: 'archived', label: 'Archived' },
  ]

  return (
    <div className="space-y-5">
      <ResourcePageHeader title="Application Registry" description="Products, apps, and tools being built or live" newHref={`${BASE}/new`} newLabel="Add Application" />

      <LifecycleBoard
        ideas={(boardIdeas ?? []) as LifecycleIdea[]}
        applications={(boardApps ?? []) as LifecycleApplication[]}
        verticals={verticals ?? []}
      />

      <div className="flex flex-wrap items-center gap-2">
        {filters.map(f => (
          <Link key={f.key} href={f.key ? `${BASE}?filter=${f.key}` : BASE} className={`rounded-full border px-3 py-1 text-xs transition-colors ${(filter || '') === f.key ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2' : 'border-border text-muted-foreground hover:text-foreground'}`}>{f.label}</Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <ResourceEmptyState showAll={false} basePath={BASE} />
      ) : (
        <GridReveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((app, index) => {
            const primaryAppUrl = app.website_url || app.deployment_url

            return (
              <GridRevealItem key={app.id} index={index} className="h-full">
                <Link href={`${BASE}/${app.id}`} className="zo-grid-reveal-card block h-full rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{app.name}</p>
                    <Badge variant="outline" className={`text-[10px] ${STAGE_COLORS[app.stage] ?? ''}`}>{app.stage.replace(/_/g, ' ')}</Badge>
                  </div>
                  {primaryAppUrl && (
                    <span className="mb-3 inline-flex max-w-full items-center gap-1 rounded-md border border-zo-purple/30 bg-zo-purple/10 px-2 py-1 text-xs font-medium text-zo-purple-2">
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">Open site: {formatUrlHost(primaryAppUrl)}</span>
                    </span>
                  )}
                  <div className="mb-2 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                    {app.vertical && <span className="rounded-full border border-border px-2 py-0.5">{app.vertical.name}</span>}
                    <span className="rounded-full border border-border px-2 py-0.5">{app.type.replace(/_/g, ' ')}</span>
                    <span className="rounded-full border border-border px-2 py-0.5">Owner: {app.owner?.full_name || app.owner?.email || 'Unassigned'}</span>
                  </div>
                  {app.description && <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{app.description}</p>}
                  {app.next_action && (
                    <p className="mb-3 rounded-md border border-border/70 bg-background/60 px-2 py-1.5 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">Next:</span> {app.next_action}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    <SourceIndicator label="Repo" connected={!!app.repo_url} />
                    <SourceIndicator label="Local" connected={!!app.local_folder_path} />
                    <SourceIndicator label="Docs" connected={!!(app.docs_url || app.docs_folder_path)} />
                    <SourceIndicator label="Deploy" connected={!!app.deployment_url} />
                    <SourceIndicator label="DB" connected={!!app.database_url} />
                    <SourceIndicator label="n8n" connected={!!app.n8n_workflow_url} />
                    <SourceIndicator label="Site" connected={!!app.website_url} />
                  </div>
                  {app.last_synced_at && <p className="mt-2 text-[10px] text-muted-foreground">Synced {new Date(app.last_synced_at).toLocaleDateString()}</p>}
                </Link>
              </GridRevealItem>
            )
          })}
        </GridReveal>
      )}
    </div>
  )
}

function formatUrlHost(value: string) {
  try {
    return new URL(value).hostname
  } catch {
    return value
  }
}

function SourceIndicator({ label, connected }: { label: string; connected: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${connected ? 'border-green-500/30 text-green-400' : 'border-border text-muted-foreground/50'}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
      {label}
    </span>
  )
}
