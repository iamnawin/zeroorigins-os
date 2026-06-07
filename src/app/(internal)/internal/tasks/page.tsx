import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceViewTabs } from '@/components/resource-kit/resource-view-tabs'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { terminalStatusFilter } from '@/lib/resource-kit/status'

const BASE = '/internal/tasks'

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()
  let query = supabase.from('tasks').select('*, projects(title)').order('created_at', { ascending: false })
  if (!showAll) query = query.not('status', 'in', terminalStatusFilter('tasks'))
  const { data: tasks } = await query

  return (
    <div className="space-y-6">
      <ResourcePageHeader title="Tasks" description="All tasks across projects" newHref={`${BASE}/new`} newLabel="New Task" />
      <ResourceViewTabs basePath={BASE} showAll={showAll} />
      <div className="grid gap-2">
        {tasks?.map(task => (
          <Link key={task.id} href={`${BASE}/${task.id}`}>
            <Card className="bg-card border-border hover:border-zo-purple/30 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{task.title}</p>
                  {task.projects?.title && <p className="text-xs text-muted-foreground mt-0.5">{task.projects.title}</p>}
                </div>
                <ResourceStatusBadge status={task.status} />
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!tasks || tasks.length === 0) && <ResourceEmptyState showAll={showAll} basePath={BASE} />}
      </div>
    </div>
  )
}
