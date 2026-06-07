import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceViewTabs } from '@/components/resource-kit/resource-view-tabs'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { terminalStatusFilter } from '@/lib/resource-kit/status'

const BASE = '/internal/projects'

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()
  let query = supabase.from('projects').select('*').order('created_at', { ascending: false })
  if (!showAll) query = query.not('status', 'in', terminalStatusFilter('projects'))
  const { data: projects } = await query

  return (
    <div className="space-y-6">
      <ResourcePageHeader title="Projects" description="Active and planned projects" newHref={`${BASE}/new`} newLabel="New Project" />
      <ResourceViewTabs basePath={BASE} showAll={showAll} />
      <div className="grid gap-3">
        {projects?.map(project => (
          <Link key={project.id} href={`${BASE}/${project.id}`}>
            <Card className="bg-card border-border hover:border-zo-purple/30 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{project.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{project.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {project.priority && <Badge variant="outline" className="text-[10px]">{project.priority}</Badge>}
                  <ResourceStatusBadge status={project.status} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!projects || projects.length === 0) && <ResourceEmptyState showAll={showAll} basePath={BASE} />}
      </div>
    </div>
  )
}
