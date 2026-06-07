import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CLOSED = ['done', 'cancelled']

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()
  let query = supabase.from('tasks').select('*, projects(title)').order('created_at', { ascending: false })
  if (!showAll) query = query.not('status', 'in', `(${CLOSED.join(',')})`)
  const { data: tasks } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zo-chrome">Tasks</h1>
          <p className="text-sm text-muted-foreground">All tasks across projects</p>
        </div>
        <Link href="/internal/tasks/new">
          <Button size="sm"><Plus className="w-4 h-4 mr-1" />New Task</Button>
        </Link>
      </div>
      <div className="flex gap-1">
        <Link href="/internal/tasks">
          <span className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${!showAll ? 'text-zo-amber border border-zo-amber/50' : 'text-muted-foreground hover:text-foreground'}`}>Active</span>
        </Link>
        <Link href="/internal/tasks?view=all">
          <span className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${showAll ? 'text-zo-amber border border-zo-amber/50' : 'text-muted-foreground hover:text-foreground'}`}>All</span>
        </Link>
      </div>
      <div className="grid gap-2">
        {tasks?.map(task => (
          <Link key={task.id} href={`/internal/tasks/${task.id}`}>
            <Card className="bg-card border-border hover:border-zo-amber/30 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{task.title}</p>
                  {task.projects?.title && <p className="text-xs text-muted-foreground mt-0.5">{task.projects.title}</p>}
                </div>
                <Badge variant="outline" className="text-[10px]">{task.status}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!tasks || tasks.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {showAll ? 'No tasks yet.' : 'No open tasks. '}
            {!showAll && <Link href="/internal/tasks?view=all" className="text-zo-amber hover:underline">View all</Link>}
          </p>
        )}
      </div>
    </div>
  )
}
