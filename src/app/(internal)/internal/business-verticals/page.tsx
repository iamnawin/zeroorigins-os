import Link from 'next/link'
import { ArrowRight, PanelsTopLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { GridReveal, GridRevealItem } from '@/components/ui/grid-reveal'
import type { BusinessVertical } from '@/types'

export default async function BusinessVerticalsPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('business_verticals').select('*').order('name')
  const verticals = (data ?? []) as BusinessVertical[]

  return (
    <div className="space-y-6">
      <ResourcePageHeader
        title="Business Verticals"
        description="Brands, products, initiatives, and internal bets. This is what ZeroOrigins is building."
        newHref="/internal/business-verticals/new"
        newLabel="Vertical"
      />

      {verticals.length > 0 ? (
        <GridReveal className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {verticals.map((vertical, index) => (
            <GridRevealItem key={vertical.id} index={index} className="h-full">
              <Link href={`/internal/business-verticals/${vertical.id}`} className="group block h-full">
                <Card className="zo-grid-reveal-card h-full border-border bg-card">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold">{vertical.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{vertical.type.replace(/_/g, ' ')}</p>
                      </div>
                      <ResourceStatusBadge status={vertical.status} />
                    </div>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{vertical.description || 'No description yet.'}</p>
                    <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                      <span>{vertical.owner || 'No owner assigned'}</span>
                      <ArrowRight className="h-4 w-4 group-hover:text-zo-purple" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </GridRevealItem>
          ))}
        </GridReveal>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <PanelsTopLeft className="mx-auto h-8 w-8 text-zo-purple" />
          <p className="mt-3 text-sm font-semibold">No business verticals yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Add AIWithNoBrain, IgnAIte, EpicsToYou, or future initiatives here.</p>
          <Link href="/internal/business-verticals/new" className="mt-4 inline-flex text-sm font-medium text-zo-purple">Add Vertical</Link>
        </div>
      )}
    </div>
  )
}
