import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceViewTabs } from '@/components/resource-kit/resource-view-tabs'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, Code2, AlertTriangle, CheckCircle2, Rocket, Lightbulb, Box, ArrowRight } from 'lucide-react'
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
      case 'broken': return <AlertTriangle className="w-3 h-3 mr-1 text-destructive" />
      case 'deployed': return <Rocket className="w-3 h-3 mr-1 text-zo-purple" />
      case 'mvp_ready': return <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
      default: return <Code2 className="w-3 h-3 mr-1" />
    }
  }

  return (
    <div className="space-y-8 selection:bg-zo-purple/20">
      <ResourcePageHeader
        title="AI Workspace"
        description="Internal repository of apps, products, and experiments."
        newHref="/internal/ai-workspace/new"
        newLabel="Add App"
      />

      <ResourceViewTabs basePath="/internal/ai-workspace" showAll={view === 'all'} />

      {apps && apps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app: AIWorkspaceApp) => (
            <Link key={app.id} href={`/internal/ai-workspace/${app.id}`} className="group">
              <Card className="bg-card border-border hover:border-zo-purple/50 transition-all h-full shadow-lg group-hover:shadow-zo-purple/5">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-5">
                    <div className="space-y-1">
                      <h3 className="font-bold text-zo-chrome group-hover:text-zo-purple-2 transition-colors flex items-center">
                        {app.name}
                        {app.is_client_demo && <Badge variant="outline" className="ml-2 text-[8px] h-4 border-zo-purple/30 text-zo-purple-2 uppercase font-bold tracking-tighter">Demo</Badge>}
                      </h3>
                      <p className="text-[9px] text-zo-muted uppercase tracking-[0.2em] font-bold">{app.category?.replace('_', ' ')}</p>
                    </div>
                    <ResourceStatusBadge status={app.status} />
                  </div>

                  <p className="text-sm text-zo-muted line-clamp-2 mb-6 flex-1 italic leading-relaxed">
                    &ldquo;{app.description || app.business_value || 'No description provided.'}&rdquo;
                  </p>

                  <div className="flex items-center gap-4 mt-auto pt-4 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      {app.github_url && <Box className="w-4 h-4 text-zo-muted hover:text-zo-purple transition-colors" />}
                      {app.vercel_url && <Globe className="w-4 h-4 text-zo-muted hover:text-zo-purple transition-colors" />}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[10px] text-zo-muted flex items-center bg-zo-black-3 px-2 py-0.5 rounded border border-border/30">
                        {getStatusIcon(app.status)}
                        {app.status.replace('_', ' ')}
                      </span>
                      <ArrowRight className="w-3 h-3 text-zo-muted group-hover:text-zo-purple group-hover:translate-x-0.5 transition-all" />
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
