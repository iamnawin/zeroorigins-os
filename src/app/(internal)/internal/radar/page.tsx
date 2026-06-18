import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { RadarItemCard } from '@/components/radar/radar-item-card'
import { AddSignalDialog } from '@/components/radar/add-signal-dialog'
import { RssSyncButton } from '@/components/radar/rss-sync-button'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getRadarItems, getRadarDashboardCounts, getRadarSourceHealth } from '@/lib/radar/queries'
import type { RadarItemStatus, RadarItemCategory } from '@/types'

const BASE = '/internal/radar'

const CATEGORY_FILTERS = [
  { key: 'ai_news', label: 'AI News' },
  { key: 'ai_model_update', label: 'AI Models' },
  { key: 'ai_tool_update', label: 'AI Tools' },
  { key: 'salesforce_ai', label: 'Salesforce AI' },
  { key: 'local_event', label: 'Events' },
  { key: 'funding', label: 'Funding' },
  { key: 'content_opportunity', label: 'Content' },
  { key: 'india_ai', label: 'India AI' },
] as const

export default async function RadarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string; category?: string }>
}) {
  const { view, status, category } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()

  const [items, counts, sourceHealth] = await Promise.all([
    getRadarItems(supabase, {
      view: showAll ? 'all' : 'active',
      status: status as RadarItemStatus | undefined,
      category: category as RadarItemCategory | undefined,
      limit: 60,
    }),
    getRadarDashboardCounts(supabase),
    getRadarSourceHealth(supabase),
  ])

  const migrationPending = counts.migrationMissing
  const selectedCategory = CATEGORY_FILTERS.find(f => f.key === category)
  const latestSourceCheck = sourceHealth.lastCheckedAt
    ? new Date(sourceHealth.lastCheckedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : 'Not checked yet'

  return (
    <div className="space-y-5">
      <ResourcePageHeader
        title="Intelligence Radar"
        description="Market signals, AI news, events, and content opportunities"
        action={
          <AddSignalDialog>
            <Button size="sm">Add Signal</Button>
          </AddSignalDialog>
        }
      />

      {migrationPending ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-400">
          Migration 020 not yet applied — run the SQL in <code>supabase/migrations/020_radar_intelligence.sql</code> to enable Radar.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {[
              { label: 'New', value: counts.new },
              { label: 'Saved', value: counts.saved },
              { label: 'Content Ideas', value: counts.content_ideas },
              { label: 'Upcoming Events', value: counts.events_upcoming },
              { label: 'High Relevance', value: counts.high_relevance },
              { label: 'Total', value: counts.total },
            ].map(stat => (
              <div key={stat.label} className="min-h-[76px] rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-xl font-bold text-foreground sm:text-lg">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:flex sm:flex-wrap sm:items-center sm:gap-4">
              <span><strong className="text-foreground">{sourceHealth.activeRssSources}</strong> RSS sources</span>
              <span>Daily cron: 00:00 UTC</span>
              <span className="col-span-2 sm:col-span-1">Last source check: {latestSourceCheck}</span>
            </div>
            <RssSyncButton sourceCount={sourceHealth.activeRssSources} />
          </div>

          <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={BASE}
              className={`rounded-full border px-3 py-2 text-xs transition-colors ${!showAll && !status ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2' : 'border-border text-muted-foreground hover:text-foreground'}`}
            >
              Active
            </Link>
            <Link
              href={`${BASE}?view=all`}
              className={`rounded-full border px-3 py-2 text-xs transition-colors ${showAll ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2' : 'border-border text-muted-foreground hover:text-foreground'}`}
            >
              All
            </Link>
            <Link
              href={`${BASE}?status=new`}
              className={`rounded-full border px-3 py-2 text-xs transition-colors ${status === 'new' ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2' : 'border-border text-muted-foreground hover:text-foreground'}`}
            >
              New
            </Link>
            <Link
              href={`${BASE}?status=saved`}
              className={`rounded-full border px-3 py-2 text-xs transition-colors ${status === 'saved' ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2' : 'border-border text-muted-foreground hover:text-foreground'}`}
            >
              Saved
            </Link>

          </div>

          <details className="sm:hidden">
            <summary className="flex min-h-[42px] cursor-pointer items-center justify-between rounded-full border border-border px-3 py-2 text-xs text-muted-foreground">
              <span>Category: {selectedCategory?.label ?? 'All'}</span>
              <span>Filter</span>
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {CATEGORY_FILTERS.map(f => (
                <Link
                  key={f.key}
                  href={`${BASE}?category=${category === f.key ? '' : f.key}`}
                  className={`rounded-full border px-3 py-2 text-center text-xs transition-colors ${category === f.key ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2' : 'border-border text-muted-foreground hover:text-foreground'}`}
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </details>

          <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2">
            {CATEGORY_FILTERS.map(f => (
              <Link
                key={f.key}
                href={`${BASE}?category=${category === f.key ? '' : f.key}`}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${category === f.key ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2' : 'border-border text-muted-foreground hover:text-foreground'}`}
              >
                {f.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={`${BASE}/events`} className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
              Events →
            </Link>
            <Link href={`${BASE}/content-ideas`} className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
              Content Ideas →
            </Link>
            <Link href={`${BASE}/sources`} className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
              Sources →
            </Link>
          </div>
          </div>

          {items.length === 0 ? (
            <ResourceEmptyState showAll={showAll} basePath={BASE} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(item => (
                <RadarItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
