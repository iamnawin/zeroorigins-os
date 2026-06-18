import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getRadarSources } from '@/lib/radar/queries'
import { RssSyncButton } from '@/components/radar/rss-sync-button'

const BASE = '/internal/radar/sources'

export default async function RadarSourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()
  const sources = await getRadarSources(supabase, !showAll)

  const rssCount = sources.filter(s => s.rss_url).length

  return (
    <div className="space-y-5">
      <ResourcePageHeader
        title="Signal Sources"
        description="Configured RSS feeds, newsletters, and manual source references"
        newHref={`${BASE}/new`}
        newLabel="Add Source"
      />

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/internal/radar" className="hover:text-foreground">Radar</Link>
        <span>/</span>
        <span className="text-foreground">Sources</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Link
            href={BASE}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${!showAll ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            Active
          </Link>
          <Link
            href={`${BASE}?view=all`}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${showAll ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            All
          </Link>
        </div>
        {rssCount > 0 && <RssSyncButton sourceCount={rssCount} />}
      </div>

      {sources.length === 0 ? (
        <ResourceEmptyState showAll={showAll} basePath={BASE} />
      ) : (
        <div className="space-y-2">
          {sources.map(source => (
            <div
              key={source.id}
              className={`rounded-lg border border-border bg-card px-4 py-3 ${!source.is_active ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{source.name}</p>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-muted-foreground underline hover:text-foreground"
                    >
                      {source.url}
                    </a>
                  )}
                  {source.rss_url && (
                    <p className="text-[11px] text-zo-purple-2">
                      RSS {source.last_checked_at
                        ? `· last synced ${new Date(source.last_checked_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}`
                        : '· never synced'}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{source.source_type.replace(/_/g, ' ')}</Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${source.trust_level === 'high' ? 'text-emerald-400' : source.trust_level === 'medium' ? 'text-amber-400' : 'text-muted-foreground'}`}
                  >
                    {source.trust_level}
                  </Badge>
                  <span className="text-[10px] font-bold text-muted-foreground">P{source.priority}</span>
                  <Link
                    href={`${BASE}/${source.id}/edit`}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
