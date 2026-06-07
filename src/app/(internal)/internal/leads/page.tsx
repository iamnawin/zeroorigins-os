import { createClient } from '@/lib/supabase/server'
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
  let query = supabase.from('leads').select('*').order('created_at', { ascending: false })
  if (!showAll) query = query.not('status', 'in', terminalStatusFilter('leads'))
  const { data: leads } = await query

  return (
    <div className="space-y-6">
      <ResourcePageHeader title="Leads" description="Inbound leads and pipeline" newHref={`${BASE}/new`} newLabel="New Lead" />
      <ResourceViewTabs basePath={BASE} showAll={showAll} />
      <div className="grid gap-3">
        {leads?.map(lead => (
          <Link key={lead.id} href={`${BASE}/${lead.id}`}>
            <Card className="bg-card border-border hover:border-zo-purple/30 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{lead.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{lead.company || lead.email} · {lead.service_interest}</p>
                </div>
                <div className="flex items-center gap-2">
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
