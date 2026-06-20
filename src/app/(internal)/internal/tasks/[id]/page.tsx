import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bell, Clock3 } from 'lucide-react'
import { DeleteResourceButton } from '@/components/internal/delete-resource-button'

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: task } = await supabase.from('tasks').select('*, projects(id, title)').eq('id', id).single()
  if (!task) notFound()

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/internal/tasks">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/internal/tasks/${id}/edit`}>
            <Button size="sm" variant="outline">Edit</Button>
          </Link>
          <DeleteResourceButton id={id} kind="task" />
        </div>
      </div>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zo-chrome">{task.title}</CardTitle>
            <Badge>{task.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {task.projects?.title && (
            <div className="text-sm">
              <span className="text-muted-foreground">Project: </span>
              <Link href={`/internal/projects/${task.projects.id}`} className="text-zo-purple hover:underline">
                {task.projects.title}
              </Link>
            </div>
          )}
          {task.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
          )}
          <div className="grid gap-2 rounded-md border border-border bg-muted/20 p-3 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Clock3 className="h-4 w-4 text-zo-purple-2" />
              <span>Due: {task.due_at ? formatTaskDateTime(task.due_at) : task.due_date || 'Not set'}</span>
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Bell className="h-4 w-4 text-zo-purple-2" />
              <span>Reminder: {task.reminder_at ? formatTaskDateTime(task.reminder_at) : 'Off'}</span>
            </p>
            <p className="text-muted-foreground">Priority: <span className="text-foreground">{task.priority || 'normal'}</span></p>
          </div>
          <p className="text-xs text-muted-foreground">
            Created: {formatTaskDateTime(task.created_at)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function formatTaskDateTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value))
}
