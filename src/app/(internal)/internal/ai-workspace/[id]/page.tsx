import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Globe, ExternalLink, Code2, 
  MapPin, Target, 
  TrendingUp, Info, ListTodo, ShieldAlert, Box, ArrowLeft
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
    <div className="space-y-8 max-w-5xl mx-auto selection:bg-zo-purple/20">
      <ResourcePageHeader
        title={typedApp.name}
        description={typedApp.category?.replace('_', ' ') || 'App Details'}
        newHref={`/internal/ai-workspace/${id}/edit`}
        newLabel="Edit App"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Overview Section */}
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/50 pb-4">
              <div className="p-2 bg-zo-purple/10 rounded-lg">
                <Info className="w-4 h-4 text-zo-purple" />
              </div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zo-chrome">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <p className="text-zo-muted leading-relaxed italic border-l-2 border-zo-purple/30 pl-4">
                &ldquo;{typedApp.description || typedApp.business_value || 'No description provided.'}&rdquo;
              </p>
              
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-border/50">
                <div className="space-y-1">
                  <p className="text-[10px] text-zo-muted uppercase tracking-widest font-bold">App Type</p>
                  <p className="text-sm font-medium flex items-center gap-2 text-zo-chrome">
                    <Code2 className="w-4 h-4 text-zo-purple opacity-50" />
                    {typedApp.app_type?.replace('_', ' ')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-zo-muted uppercase tracking-widest font-bold">Priority</p>
                  <p className="text-sm font-medium flex items-center gap-2 capitalize text-zo-chrome">
                    <TrendingUp className="w-4 h-4 text-zo-purple opacity-50" />
                    {typedApp.priority}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links Section */}
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/50 pb-4">
              <div className="p-2 bg-zo-purple/10 rounded-lg">
                <Globe className="w-4 h-4 text-zo-purple" />
              </div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zo-chrome">Links & Infrastructure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {typedApp.local_path && (
                  <div className="p-4 bg-zo-black-3 rounded border border-border/40 flex items-center gap-4 group">
                    <MapPin className="w-5 h-5 text-zo-muted group-hover:text-zo-purple transition-colors" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-zo-muted uppercase font-bold tracking-tighter">Local Path</p>
                      <p className="text-xs truncate font-mono text-zo-chrome">{typedApp.local_path}</p>
                    </div>
                  </div>
                )}
                {typedApp.github_url && (
                  <Link href={typedApp.github_url} target="_blank" className="p-4 bg-zo-black-3 rounded border border-border/40 flex items-center gap-4 hover:border-zo-purple/50 transition-colors group">
                    <Box className="w-5 h-5 text-zo-muted group-hover:text-zo-purple-2" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-zo-muted uppercase font-bold tracking-tighter">GitHub</p>
                      <p className="text-xs truncate text-zo-purple group-hover:text-zo-purple-2 transition-colors font-medium">View Repository</p>
                    </div>
                  </Link>
                )}
                {typedApp.vercel_url && (
                  <Link href={typedApp.vercel_url} target="_blank" className="p-4 bg-zo-black-3 rounded border border-border/40 flex items-center gap-4 hover:border-zo-purple/50 transition-colors group">
                    <Globe className="w-5 h-5 text-zo-muted group-hover:text-zo-purple-2" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-zo-muted uppercase font-bold tracking-tighter">Vercel</p>
                      <p className="text-xs truncate text-zo-purple group-hover:text-zo-purple-2 transition-colors font-medium">View Deployment</p>
                    </div>
                  </Link>
                )}
                {typedApp.live_url && (
                  <Link href={typedApp.live_url} target="_blank" className="p-4 bg-zo-black-3 rounded border border-border/40 flex items-center gap-4 hover:border-zo-purple/50 transition-colors group">
                    <ExternalLink className="w-5 h-5 text-zo-muted group-hover:text-zo-purple-2" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-zo-muted uppercase font-bold tracking-tighter">Live App</p>
                      <p className="text-xs truncate text-zo-purple group-hover:text-zo-purple-2 transition-colors font-medium">Open Site</p>
                    </div>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Business Potential */}
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/50 pb-4">
              <div className="p-2 bg-zo-purple/10 rounded-lg">
                <Target className="w-4 h-4 text-zo-purple" />
              </div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zo-chrome">Business Potential</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-[10px] text-zo-muted uppercase tracking-widest font-bold">Target User</p>
                  <p className="text-sm font-medium text-zo-chrome">{typedApp.target_user || 'Undetermined'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-zo-muted uppercase tracking-widest font-bold">Monetization</p>
                  <p className="text-sm font-bold text-zo-purple-2">{typedApp.monetization_idea || 'Idea Phase'}</p>
                </div>
              </div>
              <div className="space-y-2 pt-6 border-t border-border/50">
                <p className="text-[10px] text-zo-muted uppercase tracking-widest font-bold">Business Value</p>
                <p className="text-sm text-zo-silver leading-relaxed leading-relaxed italic">&ldquo;{typedApp.business_value || 'No value proposition defined yet.'}&rdquo;</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status & Attributes */}
        <div className="space-y-8">
          <Card className="bg-card border-border border-l-4 border-l-zo-purple shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-zo-muted uppercase tracking-widest font-bold">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold capitalize text-zo-chrome">{typedApp.status.replace('_', ' ')}</span>
                <ResourceStatusBadge status={typedApp.status} />
              </div>

              <div className="space-y-6 pt-6 border-t border-border/50">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zo-purple mb-1">
                    <ListTodo className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Next Action</span>
                  </div>
                  <p className="text-xs bg-zo-purple/5 p-3 rounded border border-zo-purple/10 text-zo-chrome">{typedApp.next_action || 'Define next steps.'}</p>
                </div>

                {typedApp.current_issue && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-destructive mb-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Current Issue</span>
                    </div>
                    <p className="text-xs bg-destructive/5 p-3 rounded border border-destructive/10 text-destructive font-medium">{typedApp.current_issue}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-zo-muted uppercase tracking-widest font-bold">Attributes</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex flex-wrap gap-2">
                {typedApp.is_internal_tool && <Badge className="bg-zo-silver/10 text-zo-silver border-none text-[10px] font-bold tracking-tighter">INTERNAL TOOL</Badge>}
                {typedApp.is_client_demo && <Badge className="bg-zo-purple/20 text-zo-purple-2 border-none text-[10px] font-bold tracking-tighter">CLIENT DEMO</Badge>}
                {typedApp.is_sellable_product && <Badge className="bg-zo-purple text-white border-none text-[10px] font-bold tracking-tighter shadow-lg shadow-zo-purple/20">SELLABLE</Badge>}
                {typedApp.is_open_source && <Badge variant="outline" className="text-[10px] border-zo-muted/30 text-zo-muted font-bold tracking-tighter uppercase">Open Source</Badge>}
              </div>
              
              <div className="mt-8 space-y-3 pt-6 border-t border-border/30">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] text-zo-muted uppercase tracking-widest font-bold">Registered</p>
                  <p className="text-[10px] text-zo-chrome">{new Date(typedApp.created_at).toLocaleDateString()}</p>
                </div>
                {typedApp.last_checked_at && (
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] text-zo-muted uppercase tracking-widest font-bold">Last Checked</p>
                    <p className="text-[10px] text-zo-chrome">{new Date(typedApp.last_checked_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="pt-2">
            <Button variant="secondary" className="w-full text-xs h-11 border-zo-border-soft hover:border-zo-purple/30 group">
              <Link href="/internal/ai-workspace" className="flex items-center justify-center gap-2">
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Workspace
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
