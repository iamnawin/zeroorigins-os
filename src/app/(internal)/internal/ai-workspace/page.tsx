import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, Code2, AlertTriangle, CheckCircle2, Rocket, Lightbulb, Box, ArrowRight, Search, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { AIWorkspaceApp, AI_FOLDER_GROUPS } from '@/types'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const QUICK_FILTERS = ['All', ...AI_FOLDER_GROUPS] as const

export default async function AIWorkspacePage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = typeof params.search === 'string' ? params.search : ''
  const group = typeof params.group === 'string' ? params.group : ''
  const status = typeof params.status === 'string' ? params.status : ''
  const supabase = await createClient()

  let query = supabase.from('ai_workspace_apps').select('*').order('updated_at', { ascending: false })

  if (group && group !== 'All') query = query.eq('folder_group', group)
  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data: apps, error } = await query
  if (error) console.error('Error fetching apps:', error)

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'idea': return <Lightbulb className="w-3 h-3 mr-1" />
      case 'broken': return <AlertTriangle className="w-3 h-3 mr-1 text-destructive" />
      case 'deployed': case 'live': return <Rocket className="w-3 h-3 mr-1 text-zo-purple" />
      case 'mvp_ready': case 'delivered': return <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
      default: return <Code2 className="w-3 h-3 mr-1" />
    }
  }

  const buildHref = (overrides: Record<string, string>) => {
    const p = new URLSearchParams()
    const merged = { search, group, status, ...overrides }
    for (const [k, v] of Object.entries(merged)) { if (v) p.set(k, v) }
    const qs = p.toString()
    return `/internal/ai-workspace${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6 selection:bg-zo-purple/20">
      <ResourcePageHeader
        title="AI Workspace"
        description="Registry of all apps, repos, experiments, brands, and products. Apps can be added manually or synced from D:\AI-Workspace."
        newHref="/internal/ai-workspace/new"
        newLabel="Add App"
      />

      {/* Search */}
      <form className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zo-muted" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search apps..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-zo-black-3 border border-border rounded focus:outline-none focus:border-zo-purple/50 text-zo-chrome placeholder:text-zo-muted"
          />
        </div>
        {(search || group || status) && (
          <Link href="/internal/ai-workspace" className="text-xs text-zo-muted hover:text-zo-purple px-3 py-2 border border-border rounded">
            Clear
          </Link>
        )}
      </form>

      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_FILTERS.map((g) => {
          const active = (g === 'All' && !group) || group === g
          return (
            <Link
              key={g}
              href={buildHref({ group: g === 'All' ? '' : g })}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
                active
                  ? 'bg-zo-purple/20 border-zo-purple/40 text-zo-purple-2'
                  : 'border-border text-zo-muted hover:border-zo-purple/30 hover:text-zo-chrome'
              }`}
            >
              {g}
            </Link>
          )
        })}
      </div>

      {/* Results */}
      {apps && apps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {apps.map((app: AIWorkspaceApp) => (
            <Link key={app.id} href={`/internal/ai-workspace/${app.id}`} className="group">
              <Card className="bg-card border-border hover:border-zo-purple/50 transition-all h-full shadow-lg group-hover:shadow-zo-purple/5">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-bold text-zo-chrome group-hover:text-zo-purple-2 transition-colors truncate">{app.name}</h3>
                      <p className="text-[9px] text-zo-muted uppercase tracking-[0.2em] font-bold">{app.category?.replace(/_/g, ' ')}</p>
                    </div>
                    <ResourceStatusBadge status={app.status} />
                  </div>

                  <p className="text-xs text-zo-muted line-clamp-2 mb-4 flex-1 italic leading-relaxed">
                    {app.description || app.business_value || 'No description.'}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {app.is_live && <Badge className="bg-green-500/20 text-green-400 border-none text-[8px] font-bold">LIVE</Badge>}
                    {app.is_delivered && <Badge className="bg-blue-500/20 text-blue-400 border-none text-[8px] font-bold">DELIVERED</Badge>}
                    {app.is_sellable_product && <Badge className="bg-zo-purple/20 text-zo-purple-2 border-none text-[8px] font-bold">SELLABLE</Badge>}
                    {app.is_client_demo && <Badge className="bg-amber-500/20 text-amber-400 border-none text-[8px] font-bold">DEMO</Badge>}
                    {app.is_open_source && <Badge variant="outline" className="text-[8px] border-zo-muted/30 text-zo-muted font-bold">OSS</Badge>}
                    {app.is_internal_tool && !app.is_live && !app.is_delivered && (
                      <Badge variant="outline" className="text-[8px] border-border text-zo-muted font-bold">INTERNAL</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-auto pt-3 border-t border-border/40">
                    {app.folder_group && (
                      <span className="text-[9px] text-zo-muted flex items-center gap-1">
                        <FolderOpen className="w-3 h-3" />{app.folder_group}
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      {app.github_url && <Box className="w-3.5 h-3.5 text-zo-muted" />}
                      {(app.vercel_url || app.live_url) && <Globe className="w-3.5 h-3.5 text-zo-muted" />}
                      <span className="text-[9px] text-zo-muted flex items-center">
                        {getStatusIcon(app.status)}
                        {app.status.replace(/_/g, ' ')}
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
        <ResourceEmptyState showAll={true} basePath="/internal/ai-workspace" />
      )}
    </div>
  )
}
