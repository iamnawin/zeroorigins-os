import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ContentIdeaCard } from '@/components/radar/content-idea-card'
import Link from 'next/link'
import { getRadarContentIdeas } from '@/lib/radar/queries'

const BASE = '/internal/radar/content-ideas'

export default async function RadarContentIdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()
  const ideas = await getRadarContentIdeas(supabase, showAll ? 'all' : 'active')

  return (
    <div className="space-y-5">
      <ResourcePageHeader
        title="Content Ideas"
        description="AI-generated content drafts from market signals"
      />

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/internal/radar" className="hover:text-foreground">Radar</Link>
        <span>/</span>
        <span className="text-foreground">Content Ideas</span>
      </div>

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

      {ideas.length === 0 ? (
        <ResourceEmptyState showAll={showAll} basePath={BASE} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ideas.map(idea => (
            <ContentIdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  )
}
