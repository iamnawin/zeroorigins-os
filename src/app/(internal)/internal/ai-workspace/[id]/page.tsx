import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Globe, ExternalLink, Code2, 
  MapPin, Target, 
  TrendingUp, Info, ListTodo, ShieldAlert, Box
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AIWorkspaceApp } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AppDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: app } = await supabase
    .from('ai_workspace_apps')
    .select('*')
    .eq('id', id)
    .single()

  if (!app) notFound()

  const typedApp = app as AIWorkspaceApp

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <ResourcePageHeader
        title={typedApp.name}
        description={typedApp.category?.replace('_', ' ') || 'App Details'}
        newHref={`/internal/ai-workspace/${id}/edit`}
        newLabel="Edit App"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Section */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Info className="w-4 h-4 text-zo-amber" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed italic">
                &ldquo;{typedApp.description || typedApp.business_value || 'No description provided.'}&rdquo;
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">App Type</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-zo-silver/50" />
                    {typedApp.app_type?.replace('_', ' ')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Priority</p>
                  <p className="text-sm font-medium flex items-center gap-2 capitalize">
                    <TrendingUp className="w-4 h-4 text-zo-silver/50" />
                    {typedApp.priority}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links Section */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Globe className="w-4 h-4 text-zo-amber" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Links & Infrastructure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {typedApp.local_path && (
                  <div className="p-3 bg-black/40 rounded border border-border/40 flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Local Path</p>
                      <p className="text-xs truncate font-mono">{typedApp.local_path}</p>
                    </div>
                  </div>
                )}
                {typedApp.github_url && (
                  <Link href={typedApp.github_url} target="_blank" className="p-3 bg-black/40 rounded border border-border/40 flex items-center gap-3 hover:border-zo-amber/50 transition-colors group">
                    <Box className="w-4 h-4 text-muted-foreground group-hover:text-zo-amber" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">GitHub</p>
                      <p className="text-xs truncate text-zo-silver group-hover:text-zo-amber transition-colors">View Repository</p>
                    </div>
                  </Link>
                )}
                {typedApp.vercel_url && (
                  <Link href={typedApp.vercel_url} target="_blank" className="p-3 bg-black/40 rounded border border-border/40 flex items-center gap-3 hover:border-zo-amber/50 transition-colors group">
                    <Globe className="w-4 h-4 text-muted-foreground group-hover:text-zo-amber" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Vercel</p>
                      <p className="text-xs truncate text-zo-silver group-hover:text-zo-amber transition-colors">View Deployment</p>
                    </div>
                  </Link>
                )}
                {typedApp.live_url && (
                  <Link href={typedApp.live_url} target="_blank" className="p-3 bg-black/40 rounded border border-border/40 flex items-center gap-3 hover:border-zo-amber/50 transition-colors group">
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-zo-amber" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Live App</p>
                      <p className="text-xs truncate text-zo-silver group-hover:text-zo-amber transition-colors">Open Site</p>
                    </div>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Business Potential */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Target className="w-4 h-4 text-zo-amber" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Business Potential</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Target User</p>
                  <p className="text-sm font-medium">{typedApp.target_user || 'Undetermined'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Monetization</p>
                  <p className="text-sm font-medium text-zo-amber">{typedApp.monetization_idea || 'Idea Phase'}</p>
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Business Value</p>
                <p className="text-sm text-zo-silver">{typedApp.business_value || 'No value proposition defined yet.'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status & Attributes */}
        <div className="space-y-6">
          <Card className="bg-card border-border border-l-4 border-l-zo-amber">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold capitalize">{typedApp.status.replace('_', ' ')}</span>
                <ResourceStatusBadge status={typedApp.status} />
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-zo-amber mb-1">
                    <ListTodo className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Next Action</span>
                  </div>
                  <p className="text-xs bg-zo-amber/5 p-2 rounded border border-zo-amber/10">{typedApp.next_action || 'Define next steps.'}</p>
                </div>

                {typedApp.current_issue && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-destructive mb-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Current Issue</span>
                    </div>
                    <p className="text-xs bg-destructive/5 p-2 rounded border border-destructive/10 text-destructive">{typedApp.current_issue}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest">Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {typedApp.is_internal_tool && <Badge className="bg-zo-silver/10 text-zo-silver border-none text-[10px]">Internal Tool</Badge>}
                {typedApp.is_client_demo && <Badge className="bg-zo-amber/20 text-zo-amber border-none text-[10px]">Client Demo</Badge>}
                {typedApp.is_sellable_product && <Badge className="bg-zo-amber text-black border-none text-[10px] font-bold">Sellable</Badge>}
                {typedApp.is_open_source && <Badge variant="outline" className="text-[10px]">Open Source</Badge>}
              </div>
              
              <div className="mt-6 space-y-1">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Registered</p>
                <p className="text-[10px]">{new Date(typedApp.created_at).toLocaleDateString()} {new Date(typedApp.created_at).toLocaleTimeString()}</p>
              </div>
              {typedApp.last_checked_at && (
                <div className="mt-3 space-y-1">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Last Checked</p>
                  <p className="text-[10px]">{new Date(typedApp.last_checked_at).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="pt-2">
            <Button variant="outline" className="w-full text-xs h-10 border-border/50 hover:bg-secondary">
              <Link href="/internal/ai-workspace">← Back to Workspace</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
