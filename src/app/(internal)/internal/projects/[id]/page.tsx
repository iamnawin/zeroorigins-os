import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!project) notFound()

  const { data: tasks } = await supabase.from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/internal/projects">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        </Link>
        <Link href={`/internal/projects/${id}/edit`}>
          <Button size="sm" variant="outline">Edit</Button>
        </Link>
      </div>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zo-chrome">{project.title}</CardTitle>
            <div className="flex gap-2">
              {project.priority && <Badge variant="outline">{project.priority}</Badge>}
              <Badge>{project.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description || 'No description.'}</p>
          {project.start_date && <p className="text-xs text-muted-foreground">Start: {project.start_date}</p>}
          {project.target_date && <p className="text-xs text-muted-foreground">Target: {project.target_date}</p>}
        </CardContent>
      </Card>
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-sm text-zo-chrome">Tasks ({tasks?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {tasks?.map(task => (
            <Link key={task.id} href={`/internal/tasks/${task.id}`}>
              <div className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:text-zo-purple transition-colors">
                <span className="text-sm text-foreground">{task.title}</span>
                <Badge variant="outline" className="text-[10px]">{task.status}</Badge>
              </div>
            </Link>
          ))}
          {(!tasks || tasks.length === 0) && <p className="text-xs text-muted-foreground">No tasks yet.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
