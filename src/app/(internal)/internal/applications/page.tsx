import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Application } from '@/types'

const BASE = '/internal/applications'

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
  let query = supabase.from('applications').select('*').order('name')

  if (filter === 'archived') query = query.eq('status', 'archived')
  else if (filter === 'production_ready') query = query.eq('stage', 'production_ready').neq('status', 'archived')
  else if (filter === 'live') query = query.eq('stage', 'live').neq('status', 'archived')
  else if (filter === 'prototype') query = query.eq('stage', 'prototype').neq('status', 'archived')
  else if (filter === 'missing_repo') query = query.is('repo_url', null).neq('status', 'archived')
  else if (filter === 'missing_local') query = query.is('local_folder_path', null).neq('status', 'archived')
  else if (filter === 'missing_docs') query = query.is('docs_url', null).neq('status', 'archived')
  else if (filter === 'missing_deploy') query = query.is('deployment_url', null).neq('status', 'archived')
  else query = query.neq('status', 'archived')

  const { data } = await query
  const rows = (data ?? []) as Application[]

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
      <ResourcePageHeader title="Application Registry" description="Products, apps, and tools being built or live" newHref={`${BASE}/new`} newLabel="Add Application" showNew={false} />

      <div className="flex flex-wrap items-center gap-2">
        {filters.map(f => (
          <Link key={f.key} href={f.key ? `${BASE}?filter=${f.key}` : BASE} className={`rounded-full border px-3 py-1 text-xs transition-colors ${(filter || '') === f.key ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2' : 'border-border text-muted-foreground hover:text-foreground'}`}>{f.label}</Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <ResourceEmptyState showAll={false} basePath={BASE} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(app => (
            <Link key={app.id} href={`${BASE}/${app.id}`} className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-zo-purple/40">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground line-clamp-1">{app.name}</p>
                <Badge variant="outline" className={`text-[10px] ${STAGE_COLORS[app.stage] ?? ''}`}>{app.stage.replace(/_/g, ' ')}</Badge>
              </div>
              {app.description && <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{app.description}</p>}
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
          ))}
        </div>
      )}
    </div>
  )
}

function SourceIndicator({ label, connected }: { label: string; connected: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${connected ? 'border-green-500/30 text-green-400' : 'border-border text-muted-foreground/50'}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
      {label}
    </span>
  )
}
