import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: tasks } = await supabase.from('tasks').select('*, projects(title)').order('created_at', { ascending: false })

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
      <div className="grid gap-2">
        {tasks?.map(task => (
          <Card key={task.id} className="bg-card border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">{task.title}</p>
                {task.projects?.title && <p className="text-xs text-muted-foreground mt-0.5">{task.projects.title}</p>}
              </div>
              <Badge variant="outline" className="text-[10px]">{task.status}</Badge>
            </CardContent>
          </Card>
        ))}
        {(!tasks || tasks.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">No tasks yet.</p>
        )}
      </div>
    </div>
  )
}
