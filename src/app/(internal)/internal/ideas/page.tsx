import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceViewTabs } from '@/components/resource-kit/resource-view-tabs'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { terminalStatusFilter } from '@/lib/resource-kit/status'

const BASE = '/internal/ideas'

export default async function IdeasPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()
  let query = supabase.from('ideas').select('*').order('created_at', { ascending: false })
  if (!showAll) query = query.not('status', 'in', terminalStatusFilter('ideas'))
  const { data: ideas } = await query

  return (
    <div className="space-y-6">
      <ResourcePageHeader title="Ideas" description="Capture and review ideas before execution" newHref={`${BASE}/new`} newLabel="New Idea" />
      <ResourceViewTabs basePath={BASE} showAll={showAll} />
      <div className="grid gap-3">
        {ideas?.map(idea => (
          <Link key={idea.id} href={`${BASE}/${idea.id}`}>
            <Card className="bg-card border-border hover:border-zo-amber/30 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{idea.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{idea.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {idea.priority && <Badge variant="outline" className="text-[10px]">{idea.priority}</Badge>}
                  <ResourceStatusBadge status={idea.status} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!ideas || ideas.length === 0) && <ResourceEmptyState showAll={showAll} basePath={BASE} />}
      </div>
    </div>
  )
}
