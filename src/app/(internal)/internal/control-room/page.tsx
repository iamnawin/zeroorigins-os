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
    { label: 'Ideas', count: ideas.count ?? 0, icon: Lightbulb, color: 'text-zo-amber' },
    { label: 'Apps', count: apps.count ?? 0, icon: Bot, color: 'text-zo-silver' },
    { label: 'Projects', count: projects.count ?? 0, icon: FolderKanban, color: 'text-zo-amber' },
    { label: 'Tasks', count: tasks.count ?? 0, icon: CheckSquare, color: 'text-zo-silver' },
    { label: 'Leads', count: leads.count ?? 0, icon: Users, color: 'text-zo-amber' },
    { label: 'Partners', count: partners.count ?? 0, icon: Handshake, color: 'text-zo-silver' },
  ]

  const activeProjects = projects.data?.filter(p => p.status === 'active') ?? []
  const openTasks = tasks.data?.filter(t => !['done', 'cancelled'].includes(t.status)) ?? []
  const newLeads = leads.data?.filter(l => l.status === 'new') ?? []

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zo-chrome flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-zo-amber" />
            Control Room
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, <span className="text-foreground font-medium">{profile?.full_name || user?.email}</span>. System is operational.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-zo-amber hover:bg-zo-amber/90 text-black font-bold">
            <Link href="/internal/ideas/new" className="flex items-center"><Plus className="w-4 h-4 mr-1" /> New Idea</Link>
          </Button>
          <Button size="sm" variant="outline" className="text-xs border-border/50">
            <Link href="/internal/tasks">View Tasks</Link>
          </Button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="bg-card border-border hover:border-zo-amber/30 transition-all group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <s.icon className={`w-4 h-4 ${s.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                <span className="text-2xl font-bold text-foreground">{s.count}</span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2 font-semibold">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Insights */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border border-t-2 border-t-zo-amber">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] text-muted-foreground uppercase tracking-widest">Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-zo-chrome">{activeProjects.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border border-t-2 border-t-zo-silver">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] text-muted-foreground uppercase tracking-widest">Open Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-zo-chrome">{openTasks.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border border-t-2 border-t-zo-amber">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] text-muted-foreground uppercase tracking-widest">New Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-zo-chrome">{newLeads.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* AI Workspace Snapshot */}
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-zo-amber" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider">AI Workspace Snapshot</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="text-[10px] h-7 text-muted-foreground">
                <Link href="/internal/ai-workspace" className="flex items-center">View All <ArrowRight className="w-3 h-3 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {apps.data && apps.data.length > 0 ? (
                  apps.data.map(app => (
                    <Link key={app.id} href={`/internal/ai-workspace/${app.id}`} className="flex items-center justify-between p-3 rounded hover:bg-secondary/40 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-zo-amber group-hover:animate-pulse" />
                        <span className="text-sm font-medium">{app.name}</span>
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded capitalize">{app.status.replace('_', ' ')}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">{app.next_action || 'No next action'}</span>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">No apps registered yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions / Activity Placeholder */}
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-xs h-9 border-border/50 hover:bg-zo-amber/10 hover:text-zo-amber hover:border-zo-amber/30 transition-all">
                <Link href="/internal/leads/new" className="flex items-center"><Users className="w-3 h-3 mr-2" /> Add New Lead</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start text-xs h-9 border-border/50 hover:bg-zo-amber/10 hover:text-zo-amber hover:border-zo-amber/30 transition-all">
                <Link href="/internal/partners/new" className="flex items-center"><Handshake className="w-3 h-3 mr-2" /> Add Partner</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start text-xs h-9 border-border/50 hover:bg-zo-amber/10 hover:text-zo-amber hover:border-zo-amber/30 transition-all">
                <Link href="/internal/projects/new" className="flex items-center"><FolderKanban className="w-3 h-3 mr-2" /> Create Project</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start text-xs h-9 border-border/50 hover:bg-zo-amber/10 hover:text-zo-amber hover:border-zo-amber/30 transition-all">
                <Link href="/internal/ai-workspace/new" className="flex items-center"><Bot className="w-3 h-3 mr-2" /> Register App</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">System Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Environment</p>
                <p className="text-xs font-mono">Production / Vercel</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Database</p>
                <p className="text-xs font-mono text-green-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Connected
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
