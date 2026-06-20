import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceViewTabs } from '@/components/resource-kit/resource-view-tabs'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { terminalStatusFilter } from '@/lib/resource-kit/status'
import { Bell, Clock3 } from 'lucide-react'

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
            <Card className="cursor-pointer border-border bg-card transition-colors hover:border-zo-purple/30">
              <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {task.projects?.title && <span className="truncate">{task.projects.title}</span>}
                    {task.due_at && (
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {formatTaskDateTime(task.due_at)}
                      </span>
                    )}
                    {task.reminder_at && (
                      <span className="inline-flex items-center gap-1 text-zo-purple-2">
                        <Bell className="h-3 w-3" />
                        {formatTaskDateTime(task.reminder_at)}
                      </span>
                    )}
                    {task.priority && task.priority !== 'normal' && <span className="uppercase text-amber-300">{task.priority}</span>}
                  </div>
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
