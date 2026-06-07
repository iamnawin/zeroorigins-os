import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceViewTabs } from '@/components/resource-kit/resource-view-tabs'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { terminalStatusFilter } from '@/lib/resource-kit/status'

const BASE = '/internal/partners'

export default async function PartnersPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()
  let query = supabase.from('partners').select('*').order('created_at', { ascending: false })
  if (!showAll) query = query.not('status', 'in', terminalStatusFilter('partners'))
  const { data: partners } = await query

  return (
    <div className="space-y-6">
      <ResourcePageHeader title="Partners" description="Partner and tie-up applications" newHref={`${BASE}/new`} newLabel="Add Partner" />
      <ResourceViewTabs basePath={BASE} showAll={showAll} />
      <div className="grid gap-3">
        {partners?.map(partner => (
          <Link key={partner.id} href={`${BASE}/${partner.id}`}>
            <Card className="bg-card border-border hover:border-zo-purple/30 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{partner.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{partner.company || partner.email} · {partner.type}</p>
                </div>
                <ResourceStatusBadge status={partner.status} />
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!partners || partners.length === 0) && <ResourceEmptyState showAll={showAll} basePath={BASE} />}
      </div>
    </div>
  )
}
