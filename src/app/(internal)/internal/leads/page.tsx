import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireInternalUser } from '@/lib/actions/internal-resources'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceViewTabs } from '@/components/resource-kit/resource-view-tabs'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { terminalStatusFilter } from '@/lib/resource-kit/status'

const BASE = '/internal/leads'

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()
  await requireInternalUser(supabase)
  const serviceSupabase = createServiceClient()
  let query = serviceSupabase.from('leads').select('*').order('created_at', { ascending: false })
  if (!showAll) query = query.not('status', 'in', terminalStatusFilter('leads'))
  const { data: leads } = await query

  return (
    <div className="space-y-4">
      <ResourcePageHeader title="Leads" description="Inbound leads and pipeline" newHref={`${BASE}/new`} newLabel="New Lead" />
      <ResourceViewTabs basePath={BASE} showAll={showAll} />
      <div className="grid gap-2">
        {leads?.map(lead => (
          <Link key={lead.id} href={`${BASE}/${lead.id}`}>
            <Card className="cursor-pointer border-border bg-card transition-colors hover:border-zo-purple/30">
              <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium leading-5 text-foreground">{lead.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{lead.company || lead.email} - {lead.service_interest}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {lead.source && <Badge variant="outline" className="text-[10px]">{lead.source}</Badge>}
                  <ResourceStatusBadge status={lead.status} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!leads || leads.length === 0) && <ResourceEmptyState showAll={showAll} basePath={BASE} />}
      </div>
    </div>
  )
}
