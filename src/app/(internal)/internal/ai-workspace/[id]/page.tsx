import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Globe, ExternalLink, Code2, MapPin, Target,
  TrendingUp, Info, ListTodo, ShieldAlert, Box, ArrowLeft, FolderOpen, Link2, Copy
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AIWorkspaceApp } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

function LinkCard({ label, url, icon: Icon }: { label: string; url: string; icon: React.ElementType }) {
  return (
    <Link href={url} target="_blank" className="p-3 bg-zo-black-3 rounded border border-border/40 flex items-center gap-3 hover:border-zo-purple/50 transition-colors group">
      <Icon className="w-4 h-4 text-zo-muted group-hover:text-zo-purple-2 shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] text-zo-muted uppercase font-bold tracking-tighter">{label}</p>
        <p className="text-xs truncate text-zo-purple group-hover:text-zo-purple-2 transition-colors font-medium">{url}</p>
      </div>
    </Link>
  )
}

function PathCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-zo-black-3 rounded border border-border/40 flex items-center gap-3 group">
      <MapPin className="w-4 h-4 text-zo-muted shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[9px] text-zo-muted uppercase font-bold tracking-tighter">{label}</p>
        <p className="text-xs truncate font-mono text-zo-chrome">{value}</p>
      </div>
      <Copy className="w-3 h-3 text-zo-muted opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
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

  const a = app as AIWorkspaceApp

  return (
    <div className="space-y-8 max-w-5xl mx-auto selection:bg-zo-purple/20">
      <ResourcePageHeader
        title={a.name}
        description={a.category?.replace(/_/g, ' ') || 'App Details'}
        newHref={`/internal/ai-workspace/${id}/edit`}
        newLabel="Edit App"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/50 pb-4">
              <div className="p-2 bg-zo-purple/10 rounded-lg"><Info className="w-4 h-4 text-zo-purple" /></div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zo-chrome">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <p className="text-zo-muted leading-relaxed italic border-l-2 border-zo-purple/30 pl-4">
                &ldquo;{a.description || a.business_value || 'No description provided.'}&rdquo;
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <p className="text-[9px] text-zo-muted uppercase tracking-widest font-bold">App Type</p>
                  <p className="text-xs font-medium flex items-center gap-1.5 text-zo-chrome">
                    <Code2 className="w-3.5 h-3.5 text-zo-purple opacity-50" />{a.app_type?.replace(/_/g, ' ') || '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-zo-muted uppercase tracking-widest font-bold">Priority</p>
                  <p className="text-xs font-medium capitalize text-zo-chrome flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-zo-purple opacity-50" />{a.priority}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-zo-muted uppercase tracking-widest font-bold">Folder Group</p>
                  <p className="text-xs font-medium text-zo-chrome flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-zo-purple opacity-50" />{a.folder_group || '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-zo-muted uppercase tracking-widest font-bold">Owner</p>
                  <p className="text-xs font-medium text-zo-chrome">{a.owner || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links & Paths */}
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/50 pb-4">
              <div className="p-2 bg-zo-purple/10 rounded-lg"><Link2 className="w-4 h-4 text-zo-purple" /></div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zo-chrome">Links & Paths</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {a.local_path && <PathCard label="Local Path" value={a.local_path} />}
                {a.repo_path && a.repo_path !== a.local_path && <PathCard label="Repo Path" value={a.repo_path} />}
                {a.github_url && <LinkCard label="GitHub" url={a.github_url} icon={Box} />}
                {a.vercel_url && <LinkCard label="Vercel" url={a.vercel_url} icon={Globe} />}
                {a.live_url && <LinkCard label="Live URL" url={a.live_url} icon={ExternalLink} />}
                {a.prototype_url && <LinkCard label="Prototype" url={a.prototype_url} icon={ExternalLink} />}
                {a.website_url && <LinkCard label="Website" url={a.website_url} icon={Globe} />}
                {a.brand_url && <LinkCard label="Brand" url={a.brand_url} icon={Globe} />}
                {a.docs_url && <LinkCard label="Docs" url={a.docs_url} icon={ExternalLink} />}
              </div>
            </CardContent>
          </Card>

          {/* Business Potential */}
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/50 pb-4">
              <div className="p-2 bg-zo-purple/10 rounded-lg"><Target className="w-4 h-4 text-zo-purple" /></div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zo-chrome">Business Potential</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <p className="text-[9px] text-zo-muted uppercase tracking-widest font-bold">Target User</p>
                  <p className="text-sm font-medium text-zo-chrome">{a.target_user || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-zo-muted uppercase tracking-widest font-bold">Monetization</p>
                  <p className="text-sm font-bold text-zo-purple-2">{a.monetization_idea || '—'}</p>
                </div>
              </div>
              <div className="space-y-1 pt-4 border-t border-border/50">
                <p className="text-[9px] text-zo-muted uppercase tracking-widest font-bold">Business Value</p>
                <p className="text-sm text-zo-silver leading-relaxed italic">{a.business_value || '—'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="bg-card border-border border-l-4 border-l-zo-purple shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-zo-muted uppercase tracking-widest font-bold">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold capitalize text-zo-chrome">{a.status.replace(/_/g, ' ')}</span>
                <ResourceStatusBadge status={a.status} />
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-zo-purple">
                    <ListTodo className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Next Action</span>
                  </div>
                  <p className="text-xs bg-zo-purple/5 p-3 rounded border border-zo-purple/10 text-zo-chrome">{a.next_action || 'Define next steps.'}</p>
                </div>
                {a.current_issue && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-destructive">
                      <ShieldAlert className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Issue</span>
                    </div>
                    <p className="text-xs bg-destructive/5 p-3 rounded border border-destructive/10 text-destructive font-medium">{a.current_issue}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attributes */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-zo-muted uppercase tracking-widest font-bold">Attributes</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex flex-wrap gap-1.5">
                {a.is_live && <Badge className="bg-green-500/20 text-green-400 border-none text-[9px] font-bold">LIVE</Badge>}
                {a.is_delivered && <Badge className="bg-blue-500/20 text-blue-400 border-none text-[9px] font-bold">DELIVERED</Badge>}
                {a.is_internal_tool && <Badge className="bg-zo-silver/10 text-zo-silver border-none text-[9px] font-bold">INTERNAL</Badge>}
                {a.is_client_demo && <Badge className="bg-amber-500/20 text-amber-400 border-none text-[9px] font-bold">DEMO</Badge>}
                {a.is_sellable_product && <Badge className="bg-zo-purple/20 text-zo-purple-2 border-none text-[9px] font-bold">SELLABLE</Badge>}
                {a.is_open_source && <Badge variant="outline" className="text-[9px] border-zo-muted/30 text-zo-muted font-bold">OSS</Badge>}
              </div>

              <div className="mt-6 space-y-2.5 pt-4 border-t border-border/30 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-zo-muted uppercase tracking-widest font-bold">Registered</span>
                  <span className="text-zo-chrome">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                {a.last_synced_at && (
                  <div className="flex justify-between">
                    <span className="text-zo-muted uppercase tracking-widest font-bold">Last Synced</span>
                    <span className="text-zo-chrome">{new Date(a.last_synced_at).toLocaleDateString()}</span>
                  </div>
                )}
                {a.last_checked_at && (
                  <div className="flex justify-between">
                    <span className="text-zo-muted uppercase tracking-widest font-bold">Last Checked</span>
                    <span className="text-zo-chrome">{new Date(a.last_checked_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button variant="secondary" className="w-full text-xs h-10 border-zo-border-soft hover:border-zo-purple/30" asChild>
            <Link href="/internal/ai-workspace" className="flex items-center justify-center gap-2">
              <ArrowLeft className="w-3 h-3" /> Back to Workspace
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
