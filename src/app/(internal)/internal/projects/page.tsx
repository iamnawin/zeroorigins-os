import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase.from('projects').select('*').order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zo-chrome">Projects</h1>
          <p className="text-sm text-muted-foreground">Active and planned projects</p>
        </div>
        <Link href="/internal/projects/new">
          <Button size="sm"><Plus className="w-4 h-4 mr-1" />New Project</Button>
        </Link>
      </div>
      <div className="grid gap-3">
        {projects?.map(project => (
          <Link key={project.id} href={`/internal/projects/${project.id}`}>
            <Card className="bg-card border-border hover:border-zo-amber/30 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{project.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{project.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {project.priority && <Badge variant="outline" className="text-[10px]">{project.priority}</Badge>}
                  <Badge className="text-[10px]">{project.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!projects || projects.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">No projects yet.</p>
        )}
      </div>
    </div>
  )
}
