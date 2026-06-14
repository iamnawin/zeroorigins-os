import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppWindow, Bot, BriefcaseBusiness, CheckSquare, DollarSign, ExternalLink, FileText, FolderKanban, FolderOpen, Pencil, Users, Workflow } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AiAssistPanel } from '@/components/ai/AiAssistPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import type { Application, BusinessVertical, SourceRegistryEntry, Task } from '@/types'

type VerticalApplication = Application & {
  owner?: { full_name?: string | null; email?: string | null } | null
}

const sectionCards = [
  { title: 'Projects', icon: FolderKanban, text: 'Project work linked to this vertical.' },
  { title: 'Tasks', icon: CheckSquare, text: 'Execution and follow-ups.' },
  { title: 'Leads', icon: Users, text: 'Pipeline interest and prospects.' },
  { title: 'Content', icon: FileText, text: 'Assets, notes, scripts, and publishing work.' },
  { title: 'Automations', icon: Workflow, text: 'Email, calendar, and n8n workflows.' },
  { title: 'Finance', icon: DollarSign, text: 'Costs, vendors, subscriptions, and revenue.' },
]

export default async function BusinessVerticalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('business_verticals').select('*').eq('id', id).single()
  if (!data) notFound()
  const vertical = data as BusinessVertical
  const { data: sources } = await supabase
    .from('source_registry')
    .select('*')
    .eq('related_vertical_id', id)
    .order('updated_at', { ascending: false })
  const { data: applications } = await supabase
    .from('applications')
    .select('*, owner:profiles(full_name, email)')
    .eq('vertical_id', id)
    .neq('status', 'archived')
    .order('name')
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, due_date, related_vertical_id')
    .eq('related_vertical_id', id)
    .order('updated_at', { ascending: false })
  const sourceEntries = (sources ?? []) as SourceRegistryEntry[]
  const appEntries = (applications ?? []) as VerticalApplication[]
  const taskEntries = (tasks ?? []) as Task[]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-zo-purple" />
            <p className="text-xs font-bold uppercase tracking-wider text-zo-purple-2">Business Vertical</p>
          </div>
          <h1 className="mt-2 text-2xl font-bold">{vertical.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{vertical.description || 'No description yet.'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ResourceStatusBadge status={vertical.status} />
            <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">{vertical.type.replace(/_/g, ' ')}</span>
          </div>
        </div>
        <Link href={`/internal/business-verticals/${vertical.id}/edit`}>
          <Button size="sm" variant="outline"><Pencil className="mr-1 h-4 w-4" />Edit</Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-sm">Overview</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <p><span className="text-muted-foreground">Owner:</span> {vertical.owner || 'Unassigned'}</p>
              <p><span className="text-muted-foreground">Website:</span> {vertical.website || 'Not set'}</p>
              <p className="md:col-span-2"><span className="text-muted-foreground">Notes:</span> {vertical.notes || 'No notes yet.'}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {sectionCards.map(({ title, icon: Icon, text }) => (
              <Card key={title} className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-zo-purple" />
                    <p className="text-sm font-semibold">{title}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-sm">Source Folders</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {sourceEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No linked source folders yet.</p>
              ) : (
                sourceEntries.map(source => <VerticalSourceRow key={source.id} source={source} />)
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AppWindow className="h-4 w-4 text-zo-purple" />Applications / Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">stage: idea / MVP / active / package-ready / live</p>
              {appEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products linked to this vertical yet. Add an application and choose this Business Vertical.</p>
              ) : (
                appEntries.map(app => <VerticalApplicationCard key={app.id} app={app} relatedTasks={taskEntries} />)
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Bot className="h-4 w-4 text-zo-purple" />AI Assist</CardTitle></CardHeader>
            <CardContent><AiAssistPanel embedded /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function VerticalApplicationCard({ app, relatedTasks }: { app: VerticalApplication; relatedTasks: Task[] }) {
  const repoLink = app.repo_url || app.local_folder_path
  const assetCount = [
    app.repo_url,
    app.local_folder_path,
    app.docs_url || app.docs_folder_path,
    app.website_url,
    app.deployment_url,
    app.database_url,
    app.n8n_workflow_url,
    app.figma_url,
  ].filter(Boolean).length

  return (
    <Link href={`/internal/applications/${app.id}`} className="block rounded-lg border border-border bg-background/50 p-4 transition-colors hover:border-zo-purple/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{app.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{app.type.replace(/_/g, ' ')}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px]">{displayStage(app.stage)}</Badge>
          <ResourceStatusBadge status={app.status} />
        </div>
      </div>
      {app.description && <p className="mt-3 text-sm text-muted-foreground">{app.description}</p>}
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <p><span className="text-foreground">Owner:</span> {app.owner?.full_name || app.owner?.email || 'Unassigned'}</p>
        <p><span className="text-foreground">Assets:</span> {assetCount} connected</p>
        <p className="sm:col-span-2">
          <span className="text-foreground">Repo:</span> {repoLink ? formatSourceValue(repoLink) : 'Not connected'}
        </p>
        <p className="sm:col-span-2">
          <span className="text-foreground">Next Action:</span> {app.next_action || 'Set the next product move.'}
        </p>
        <p className="sm:col-span-2">
          <span className="text-foreground">Related Tasks:</span> {relatedTasks.length > 0 ? relatedTasks.slice(0, 3).map(task => task.title).join(', ') : 'No vertical tasks linked yet.'}
        </p>
      </div>
    </Link>
  )
}

function displayStage(stage: Application['stage']) {
  if (stage === 'concept') return 'idea'
  if (stage === 'prototype' || stage === 'testing') return 'MVP'
  if (stage === 'production_ready') return 'package-ready'
  if (stage === 'live') return 'live'
  return stage.replace(/_/g, ' ')
}

function formatSourceValue(value: string) {
  if (value.startsWith('http')) {
    try {
      return new URL(value).hostname
    } catch {
      return value
    }
  }
  return value
}

function VerticalSourceRow({ source }: { source: SourceRegistryEntry }) {
  const metadata = source.metadata_json as { detected_files?: string[] } | undefined
  const fileCount = metadata?.detected_files?.length ?? 0
  const value = source.local_path || source.source_url || 'No path'
  const isUrl = value.startsWith('http')

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{source.name}</p>
          <p className="mt-1 break-all text-xs text-muted-foreground">
            {isUrl ? (
              <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-zo-purple-2 hover:underline">
                {value}<ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-1"><FolderOpen className="h-3 w-3" />{value}</span>
            )}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px]">{source.source_type}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        <span>{source.status}</span>
        {fileCount > 0 && <span>{fileCount} detected files</span>}
        {source.last_synced_at && <span>Synced {new Date(source.last_synced_at).toLocaleDateString()}</span>}
      </div>
    </div>
  )
}
