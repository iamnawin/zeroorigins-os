'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { updateContentIdeaStatus } from '@/lib/radar/actions'
import type { RadarContentIdea, RadarContentStatus } from '@/types'

interface ContentIdeaCardProps {
  idea: RadarContentIdea
}

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: 'bg-blue-500/10 text-blue-400',
  instagram: 'bg-pink-500/10 text-pink-400',
  x: 'bg-slate-500/10 text-slate-300',
  youtube: 'bg-red-500/10 text-red-400',
  blog: 'bg-amber-500/10 text-amber-400',
  newsletter: 'bg-violet-500/10 text-violet-400',
}

const APPROVE_TRANSITIONS: { label: string; status: RadarContentStatus }[] = [
  { label: 'Approve', status: 'approved' },
  { label: 'Reject', status: 'rejected' },
  { label: 'Needs Review', status: 'needs_review' },
]

export function ContentIdeaCard({ idea }: ContentIdeaCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const platformColor = PLATFORM_COLORS[idea.platform] ?? 'bg-muted text-muted-foreground'

  function handleStatus(status: RadarContentStatus) {
    startTransition(async () => {
      await updateContentIdeaStatus(idea.id, status)
      router.refresh()
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${platformColor}`}>
            {idea.platform}
          </span>
          <Badge variant="outline" className="text-[10px]">{idea.content_type.replace(/_/g, ' ')}</Badge>
        </div>
        <ResourceStatusBadge status={idea.status} />
      </div>

      {idea.radar_item && (
        <Link
          href={`/internal/radar/${idea.radar_item.id}`}
          className="mb-2 block text-xs text-muted-foreground hover:text-foreground line-clamp-1"
        >
          Signal: {idea.radar_item.title}
        </Link>
      )}

      {idea.hook && (
        <p className="mb-1 text-sm font-semibold text-foreground">{idea.hook}</p>
      )}

      {idea.draft_body && (
        <p className="mb-3 whitespace-pre-wrap text-xs text-muted-foreground line-clamp-4">{idea.draft_body}</p>
      )}

      {idea.hashtags.length > 0 && (
        <p className="mb-3 text-[10px] text-muted-foreground">{idea.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}</p>
      )}

      {idea.notes?.includes('[AI generation unavailable') && (
        <p className="mb-2 rounded bg-amber-500/10 px-2 py-1 text-[10px] text-amber-400">{idea.notes}</p>
      )}

      {!['published', 'rejected', 'archived'].includes(idea.status) && (
        <div className="flex flex-wrap gap-2 pt-2">
          {APPROVE_TRANSITIONS.filter(t => t.status !== idea.status).map(t => (
            <Button
              key={t.status}
              variant={t.status === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatus(t.status)}
              disabled={isPending}
            >
              {t.label}
            </Button>
          ))}
        </div>
      )}

      <p className="mt-2 text-[10px] text-muted-foreground">
        {new Date(idea.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  )
}
