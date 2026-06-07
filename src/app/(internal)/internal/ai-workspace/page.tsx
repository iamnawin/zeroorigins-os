import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceViewTabs } from '@/components/resource-kit/resource-view-tabs'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, ExternalLink, Code2, AlertTriangle, CheckCircle2, Rocket, Lightbulb, Box } from 'lucide-react'
import Link from 'next/link'
import { AIWorkspaceApp } from '@/types'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AIWorkspacePage({ searchParams }: PageProps) {
  const params = await searchParams
  const view = params.view || 'active'
  const supabase = await createClient()

  let query = supabase.from('ai_workspace_apps').select('*').order('created_at', { ascending: false })

  if (view === 'active') {
    query = query.not('status', 'in', '("archived","paused")')
  }

  const { data: apps, error } = await query

  if (error) {
    console.error('Error fetching apps:', error)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idea': return <Lightbulb className="w-3 h-3 mr-1" />
      case 'broken': return <AlertTriangle className="w-3 h-3 mr-1" />
      case 'deployed': return <Rocket className="w-3 h-3 mr-1" />
      case 'mvp_ready': return <CheckCircle2 className="w-3 h-3 mr-1" />
      default: return <Code2 className="w-3 h-3 mr-1" />
    }
  }

  return (
    <div className="space-y-6">
      <ResourcePageHeader
        title="AI Workspace"
        description="Internal repository of apps, products, and experiments."
        newHref="/internal/ai-workspace/new"
        newLabel="Add App"
      />

      <ResourceViewTabs basePath="/internal/ai-workspace" showAll={view === 'all'} />

      {apps && apps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app: AIWorkspaceApp) => (
            <Link key={app.id} href={`/internal/ai-workspace/${app.id}`}>
              <Card className="bg-card border-border hover:border-zo-amber/50 transition-all group h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-foreground group-hover:text-zo-amber transition-colors flex items-center">
                        {app.name}
                        {app.is_client_demo && <Badge variant="outline" className="ml-2 text-[8px] h-4 border-zo-amber/30 text-zo-amber uppercase">Demo</Badge>}
                      </h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{app.category?.replace('_', ' ')}</p>
                    </div>
                    <ResourceStatusBadge status={app.status} />
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1 italic">
                    &ldquo;{app.description || app.business_value || 'No description provided.'}&rdquo;
                  </p>

                  <div className="flex items-center gap-4 mt-auto pt-4 border-t border-border/50">
                    {app.github_url && <Box className="w-4 h-4 text-muted-foreground hover:text-foreground" />}
                    {app.vercel_url && <Globe className="w-4 h-4 text-muted-foreground hover:text-foreground" />}
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground flex items-center">
                        {getStatusIcon(app.status)}
                        {app.status.replace('_', ' ')}
                      </span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-zo-amber transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <ResourceEmptyState showAll={view === 'all'} basePath="/internal/ai-workspace" />
      )}
    </div>
  )
}
