import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
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
          {task.due_date && (
            <p className="text-xs text-muted-foreground">Due: {task.due_date}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Created: {new Date(task.created_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
