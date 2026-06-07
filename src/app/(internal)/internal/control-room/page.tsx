import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb, FolderKanban, CheckSquare, Users, Handshake } from 'lucide-react'

export default async function ControlRoomPage() {
  const supabase = await createClient()

  const [ideas, projects, tasks, leads, partners] = await Promise.all([
    supabase.from('ideas').select('id, status', { count: 'exact' }),
    supabase.from('projects').select('id, status', { count: 'exact' }),
    supabase.from('tasks').select('id, status', { count: 'exact' }),
    supabase.from('leads').select('id, status', { count: 'exact' }),
    supabase.from('partners').select('id, status', { count: 'exact' }),
  ])

  const stats = [
    { label: 'Ideas', count: ideas.count ?? 0, icon: Lightbulb },
    { label: 'Projects', count: projects.count ?? 0, icon: FolderKanban },
    { label: 'Tasks', count: tasks.count ?? 0, icon: CheckSquare },
    { label: 'Leads', count: leads.count ?? 0, icon: Users },
    { label: 'Partners', count: partners.count ?? 0, icon: Handshake },
  ]

  const activeProjects = projects.data?.filter(p => p.status === 'active') ?? []
  const openTasks = tasks.data?.filter(t => !['done', 'cancelled'].includes(t.status)) ?? []
  const newLeads = leads.data?.filter(l => l.status === 'new') ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zo-chrome">Control Room</h1>
        <p className="text-sm text-muted-foreground">ZeroOrigins operating overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="bg-card border-border hover:border-zo-amber/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <s.icon className="w-4 h-4 text-zo-amber" />
                <span className="text-2xl font-bold text-foreground">{s.count}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-zo-chrome">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zo-amber">{activeProjects.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-zo-chrome">Open Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zo-amber">{openTasks.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-zo-chrome">New Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zo-amber">{newLeads.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
