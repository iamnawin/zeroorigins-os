import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { AiAssistPanel } from '@/components/ai/AiAssistPanel'
import Link from 'next/link'
import { ArrowLeft, Bot, File, Folder, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteResourceButton } from '@/components/internal/delete-resource-button'
import type { BusinessIdea, SourceRegistryEntry } from '@/types'

const TABS = ['overview', 'explorer', 'agent'] as const
type Tab = typeof TABS[number]
type TreeNode = { name: string; type: 'file' | 'folder'; path: string; extension?: string; children?: TreeNode[] }

export default async function IdeaDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params
  const { tab: rawTab } = await searchParams
  const tab: Tab = (TABS as readonly string[]).includes(rawTab ?? '') ? (rawTab as Tab) : 'overview'

  const supabase = await createClient()
  const { data } = await supabase.from('business_ideas').select('*').eq('id', id).single()
  if (!data) notFound()
  const idea = data as BusinessIdea

  const { data: sources } = await supabase.from('source_registry').select('*').eq('related_idea_id', id)
  const sourceEntries = (sources ?? []) as SourceRegistryEntry[]
  const localSource = sourceEntries.find(s => s.source_type === 'local_folder')
  const sourceTree: TreeNode[] = (localSource?.metadata_json as { source_tree?: TreeNode[] })?.source_tree ?? []

  const { data: vertical } = idea.vertical_id
    ? await supabase.from('business_verticals').select('id, name').eq('id', idea.vertical_id).single()
    : { data: null }

  const tabLabels: Record<Tab, string> = { overview: 'Overview', explorer: 'Source Explorer', agent: 'Command Center' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/internal/ideas"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button></Link>
        <div className="flex gap-2">
          <Link href={`/internal/ideas/${id}/edit`}><Button size="sm" variant="outline">Edit</Button></Link>
          <DeleteResourceButton id={id} kind="idea" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-zo-purple" />
          <p className="text-xs font-bold uppercase tracking-wider text-zo-purple-2">Idea</p>
        </div>
        <h1 className="mt-2 text-2xl font-bold">{idea.title}</h1>
        {idea.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{idea.description}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <ResourceStatusBadge status={idea.status} />
          <Badge variant="outline" className="text-[10px]">{idea.priority}</Badge>
          {idea.local_folder_path && <Badge variant="outline" className="text-[10px]">📁 linked</Badge>}
          {vertical && <Link href={`/internal/business-verticals/${vertical.id}`} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground">{vertical.name}</Link>}
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map(t => (
          <Link key={t} href={`/internal/ideas/${id}?tab=${t}`} className={`px-4 py-2 text-sm transition-colors ${tab === t ? 'border-b-2 border-zo-purple text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>{tabLabels[t]}</Link>
        ))}
      </div>

      {tab === 'overview' && (
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {idea.local_folder_path && <p><span className="text-muted-foreground">Local Folder:</span> {idea.local_folder_path}</p>}
            {idea.source && <p><span className="text-muted-foreground">Source:</span> {idea.source}</p>}
            {idea.next_action && <p><span className="text-muted-foreground">Next Action:</span> {idea.next_action}</p>}
            {idea.ai_summary && <p><span className="text-muted-foreground">AI Summary:</span> {idea.ai_summary}</p>}
            <p className="text-xs text-muted-foreground">Created: {new Date(idea.created_at).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      )}

      {tab === 'explorer' && (
        sourceTree.length > 0 ? (
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-sm">{idea.title}</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border border-border bg-background p-3 font-mono text-xs">
                <TreeView nodes={sourceTree} depth={0} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border bg-card">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No folder structure available. Run <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run scan:workspace</code> then <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run import:workspace</code> to populate.</p>
            </CardContent>
          </Card>
        )
      )}

      {tab === 'agent' && (
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Bot className="h-4 w-4 text-zo-purple" />Command Center</CardTitle></CardHeader>
          <CardContent><AiAssistPanel embedded /></CardContent>
        </Card>
      )}
    </div>
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
