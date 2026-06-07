import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Lightbulb, FolderKanban, CheckSquare, Users, 
  Handshake, Bot, ShieldCheck, Plus, ArrowRight 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ControlRoomPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id || '')
    .single()

  const [ideas, projects, tasks, leads, partners, apps] = await Promise.all([
    supabase.from('ideas').select('id, status', { count: 'exact' }),
    supabase.from('projects').select('id, status', { count: 'exact' }),
    supabase.from('tasks').select('id, status', { count: 'exact' }),
    supabase.from('leads').select('id, status', { count: 'exact' }),
    supabase.from('partners').select('id, status', { count: 'exact' }),
    supabase.from('ai_workspace_apps').select('*', { count: 'exact' }).order('priority', { ascending: false }).limit(5)
  ])

  const stats = [
    { label: 'Ideas', count: ideas.count ?? 0, icon: Lightbulb, color: 'text-zo-purple' },
    { label: 'Apps', count: apps.count ?? 0, icon: Bot, color: 'text-zo-silver' },
    { label: 'Projects', count: projects.count ?? 0, icon: FolderKanban, color: 'text-zo-purple' },
    { label: 'Tasks', count: tasks.count ?? 0, icon: CheckSquare, color: 'text-zo-silver' },
    { label: 'Leads', count: leads.count ?? 0, icon: Users, color: 'text-zo-purple' },
    { label: 'Partners', count: partners.count ?? 0, icon: Handshake, color: 'text-zo-silver' },
  ]

  const activeProjects = projects.data?.filter(p => p.status === 'active') ?? []
  const openTasks = tasks.data?.filter(t => !['done', 'cancelled'].includes(t.status)) ?? []
  const newLeads = leads.data?.filter(l => l.status === 'new') ?? []

  return (
    <div className="space-y-8 selection:bg-zo-purple/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zo-chrome flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-zo-purple" />
            Control Room
          </h1>
          <p className="text-sm text-zo-muted mt-1">
            Welcome back, <span className="text-zo-chrome font-medium">{profile?.full_name || user?.email}</span>. System is operational.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="font-bold">
            <Link href="/internal/ideas/new" className="flex items-center"><Plus className="w-4 h-4 mr-1" /> New Idea</Link>
          </Button>
          <Button size="sm" variant="secondary" className="text-xs">
            <Link href="/internal/tasks">View Tasks</Link>
          </Button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="bg-card border-border hover:border-zo-purple/30 transition-all group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <s.icon className={`w-4 h-4 ${s.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                <span className="text-2xl font-bold text-zo-chrome">{s.count}</span>
              </div>
              <p className="text-[10px] text-zo-muted uppercase tracking-widest mt-2 font-bold">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Insights */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border border-t-2 border-t-zo-purple">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] text-zo-muted uppercase tracking-widest font-bold">Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-zo-chrome">{activeProjects.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border border-t-2 border-t-zo-silver">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] text-zo-muted uppercase tracking-widest font-bold">Open Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-zo-chrome">{openTasks.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border border-t-2 border-t-zo-purple">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] text-zo-muted uppercase tracking-widest font-bold">New Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-zo-chrome">{newLeads.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* AI Workspace Snapshot */}
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-zo-purple" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider">AI Workspace Snapshot</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="text-[10px] h-7 text-zo-muted hover:text-zo-purple">
                <Link href="/internal/ai-workspace" className="flex items-center">View All <ArrowRight className="w-3 h-3 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-1">
                {apps.data && apps.data.length > 0 ? (
                  apps.data.map(app => (
                    <Link key={app.id} href={`/internal/ai-workspace/${app.id}`} className="flex items-center justify-between p-3 rounded hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-zo-purple group-hover:animate-pulse" />
                        <span className="text-sm font-medium text-zo-chrome">{app.name}</span>
                        <span className="text-[10px] text-zo-muted bg-zo-black-3 px-1.5 py-0.5 rounded capitalize border border-border/30">{app.status.replace('_', ' ')}</span>
                      </div>
                      <span className="text-[10px] text-zo-dim italic truncate max-w-[200px]">{app.next_action || 'No next action'}</span>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-zo-muted py-4 text-center">No apps registered yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions / Activity Placeholder */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              <Button variant="secondary" className="w-full justify-start text-xs h-10 hover:border-zo-purple/30 group">
                <Link href="/internal/leads/new" className="flex items-center"><Users className="w-3 h-3 mr-3 text-zo-purple opacity-70 group-hover:opacity-100" /> Add New Lead</Link>
              </Button>
              <Button variant="secondary" className="w-full justify-start text-xs h-10 hover:border-zo-purple/30 group">
                <Link href="/internal/partners/new" className="flex items-center"><Handshake className="w-3 h-3 mr-3 text-zo-purple opacity-70 group-hover:opacity-100" /> Add Partner</Link>
              </Button>
              <Button variant="secondary" className="w-full justify-start text-xs h-10 hover:border-zo-purple/30 group">
                <Link href="/internal/projects/new" className="flex items-center"><FolderKanban className="w-3 h-3 mr-3 text-zo-purple opacity-70 group-hover:opacity-100" /> Create Project</Link>
              </Button>
              <Button variant="secondary" className="w-full justify-start text-xs h-10 hover:border-zo-purple/30 group">
                <Link href="/internal/ai-workspace/new" className="flex items-center"><Bot className="w-3 h-3 mr-3 text-zo-purple opacity-70 group-hover:opacity-100" /> Register App</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">System Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] text-zo-muted uppercase tracking-widest font-bold">Environment</p>
                <p className="text-xs font-mono text-zo-chrome">Production / Vercel</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-zo-muted uppercase tracking-widest font-bold">Database</p>
                <p className="text-xs font-mono text-green-500/80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live Connection
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
