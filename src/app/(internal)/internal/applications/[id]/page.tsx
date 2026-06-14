import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppWindow, Bot, ExternalLink, File, Folder, FolderOpen, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AiAssistPanel } from '@/components/ai/AiAssistPanel'
import { ApplicationDangerActions } from '@/components/internal/application-danger-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { Badge } from '@/components/ui/badge'
import type { Application, SourceRegistryEntry } from '@/types'

const TABS = ['overview', 'explorer', 'sources', 'tasks', 'agent'] as const
type Tab = typeof TABS[number]

type TreeNode = { name: string; type: 'file' | 'folder'; path: string; extension?: string; children?: TreeNode[] }

export default async function ApplicationDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params
  const { tab: rawTab } = await searchParams
  const tab: Tab = (TABS as readonly string[]).includes(rawTab ?? '') ? (rawTab as Tab) : 'overview'

  const supabase = await createClient()
  const { data } = await supabase.from('applications').select('*').eq('id', id).single()
  if (!data) notFound()
  const app = data as Application

  const { data: sources } = await supabase
    .from('source_registry')
    .select('*')
    .eq('related_application_id', id)
    .order('created_at', { ascending: false })

  const { data: vertical } = app.vertical_id
    ? await supabase.from('business_verticals').select('id, name').eq('id', app.vertical_id).single()
    : { data: null }

  const sourceEntries = (sources ?? []) as SourceRegistryEntry[]
  const primaryAppUrl = app.website_url || app.deployment_url

  // Extract source_tree from the local_folder source_registry entry
  const localSource = sourceEntries.find(s => s.source_type === 'local_folder')
  const sourceTree: TreeNode[] = (localSource?.metadata_json as { source_tree?: TreeNode[] })?.source_tree ?? []

  const tabLabels: Record<Tab, string> = { overview: 'Overview', explorer: 'Source Explorer', sources: 'Repos & Folders', tasks: 'Tasks', agent: 'ZO_Agent' }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AppWindow className="h-5 w-5 text-zo-purple" />
              <p className="text-xs font-bold uppercase tracking-wider text-zo-purple-2">Application</p>
            </div>
            <h1 className="mt-2 text-2xl font-bold">{app.name}</h1>
            {app.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{app.description}</p>}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            {primaryAppUrl && (
              <a href={primaryAppUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button size="sm" className="w-full sm:w-auto"><ExternalLink className="mr-1 h-4 w-4" />Open website</Button>
              </a>
            )}
            <Link href={`/internal/applications/${app.id}/edit`} className="w-full sm:w-auto">
              <Button size="sm" variant="outline" className="w-full sm:w-auto"><Pencil className="mr-1 h-4 w-4" />Edit</Button>
            </Link>
            <ApplicationDangerActions applicationId={app.id} applicationName={app.name} archived={app.status === 'archived'} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px]">{app.stage.replace(/_/g, ' ')}</Badge>
          <ResourceStatusBadge status={app.status} />
          <Badge variant="outline" className="text-[10px]">{app.type.replace(/_/g, ' ')}</Badge>
          {vertical && <Link href={`/internal/business-verticals/${vertical.id}`} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground">{vertical.name}</Link>}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map(t => (
          <Link key={t} href={`/internal/applications/${id}?tab=${t}`} className={`whitespace-nowrap px-4 py-2 text-sm transition-colors ${tab === t ? 'border-b-2 border-zo-purple text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>{tabLabels[t]}</Link>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab app={app} />}
      {tab === 'explorer' && <SourceExplorerTab appName={app.name} tree={sourceTree} />}
      {tab === 'sources' && <SourcesTab app={app} sources={sourceEntries} />}
      {tab === 'tasks' && <TasksPlaceholder />}
      {tab === 'agent' && <AgentTab />}
    </div>
  )
}

function OverviewTab({ app }: { app: Application }) {
  const fields = [
    { label: 'Purpose', value: app.description },
    { label: 'Next Action', value: app.next_action },
    { label: 'Tech Stack', value: app.tech_stack.length > 0 ? app.tech_stack.join(', ') : null },
    { label: 'Build Status', value: app.build_status },
    { label: 'Last Synced', value: app.last_synced_at ? new Date(app.last_synced_at).toLocaleString() : null },
    { label: 'Notes', value: app.notes },
  ]

  return (
    <Card className="border-border bg-card">
      <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
      <CardContent className="grid gap-3 text-sm md:grid-cols-2">
        {fields.map(f => f.value && (
          <p key={f.label} className="md:col-span-2"><span className="text-muted-foreground">{f.label}:</span> {f.value}</p>
        ))}
        {fields.every(f => !f.value) && <p className="text-muted-foreground md:col-span-2">No additional details yet.</p>}
      </CardContent>
    </Card>
  )
}

function SourceExplorerTab({ appName, tree }: { appName: string; tree: TreeNode[] }) {
  if (tree.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No folder structure available. Run <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run scan:workspace</code> then <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run import:workspace</code> to populate.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader><CardTitle className="text-sm">{appName}</CardTitle></CardHeader>
      <CardContent>
        <div className="rounded-md border border-border bg-background p-3 font-mono text-xs">
          <TreeView nodes={tree} depth={0} />
        </div>
      </CardContent>
    </Card>
  )
}

function TreeView({ nodes, depth }: { nodes: TreeNode[]; depth: number }) {
  return (
    <ul className={depth > 0 ? 'ml-4 border-l border-border/50 pl-2' : ''}>
      {nodes.map(node => (
        <li key={node.path} className="py-0.5">
          <div className="inline-flex items-center gap-1.5">
            {node.type === 'folder' ? <Folder className="h-3.5 w-3.5 text-zo-purple/70" /> : <File className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className={node.type === 'folder' ? 'text-foreground' : 'text-muted-foreground'}>{node.name}</span>
          </div>
          {node.children && node.children.length > 0 && <TreeView nodes={node.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  )
}

function SourcesTab({ app, sources }: { app: Application; sources: SourceRegistryEntry[] }) {
  const directLinks = [
    { label: 'GitHub Repo', value: app.repo_url },
    { label: 'Local Folder', value: app.local_folder_path },
    { label: 'Docs URL', value: app.docs_url },
    { label: 'Docs Folder', value: app.docs_folder_path },
    { label: 'Website', value: app.website_url },
    { label: 'Deployment', value: app.deployment_url },
    { label: 'Database', value: app.database_url },
    { label: 'n8n Workflow', value: app.n8n_workflow_url },
    { label: 'Figma', value: app.figma_url },
  ]

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm">Direct Sources</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {directLinks.map(link => (
            <div key={link.label} className="flex items-center justify-between rounded-md border border-border p-2">
              <span className="text-xs text-muted-foreground">{link.label}</span>
              {link.value ? (
                <span className="flex items-center gap-1 text-xs text-foreground">
                  {link.value.startsWith('http') ? (
                    <a href={link.value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-zo-purple-2 hover:underline">
                      {new URL(link.value).hostname}<ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1"><FolderOpen className="h-3 w-3" />{link.value}</span>
                  )}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground/50">Not connected</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {sources.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-sm">Source Registry Entries</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {sources.map(s => (
              <div key={s.id} className="flex items-center justify-between rounded-md border border-border p-2">
                <div>
                  <p className="text-xs font-medium">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.source_type} · {s.local_path || s.source_url || 'No path'}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TasksPlaceholder() {
  return (
    <Card className="border-border bg-card">
      <CardContent className="py-8 text-center">
        <p className="text-sm text-muted-foreground">Tasks linked to this application will appear here once tasks support application linkage.</p>
      </CardContent>
    </Card>
  )
}

function AgentTab() {
  return (
    <Card className="border-border bg-card">
      <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Bot className="h-4 w-4 text-zo-purple" />ZO_Agent</CardTitle></CardHeader>
      <CardContent><AiAssistPanel embedded /></CardContent>
    </Card>
  )
}
