'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  classifyRadarItemWithAi,
  updateRadarItemStatus,
  createContentDraft,
} from '@/lib/radar/actions'
import type { RadarItemStatus } from '@/types'

interface RadarItemActionsProps {
  itemId: string
  currentStatus: RadarItemStatus
  onError?: (msg: string) => void
}

const STATUS_TRANSITIONS: { label: string; status: RadarItemStatus; variant?: 'default' | 'outline' | 'secondary' | 'destructive' }[] = [
  { label: 'Save', status: 'saved', variant: 'secondary' },
  { label: 'Mark Reviewed', status: 'reviewed', variant: 'outline' },
  { label: 'Content Idea', status: 'content_idea', variant: 'secondary' },
  { label: 'Event Interested', status: 'event_interested', variant: 'secondary' },
  { label: 'Ignore', status: 'ignored', variant: 'destructive' },
  { label: 'Archive', status: 'archived', variant: 'outline' },
]

const CONTENT_DRAFTS: { label: string; platform: 'linkedin' | 'instagram' | 'x'; content_type: 'text_post' | 'short_post' | 'carousel' }[] = [
  { label: 'LinkedIn Post', platform: 'linkedin', content_type: 'text_post' },
  { label: 'Instagram Caption', platform: 'instagram', content_type: 'short_post' },
  { label: 'X Thread', platform: 'x', content_type: 'short_post' },
  { label: 'Carousel Outline', platform: 'linkedin', content_type: 'carousel' },
]

export function RadarItemActions({ itemId, currentStatus, onError }: RadarItemActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClassify() {
    startTransition(async () => {
      const result = await classifyRadarItemWithAi(itemId)
      if (result.error) onError?.(result.error)
      else router.refresh()
    })
  }

  function handleStatus(status: RadarItemStatus) {
    startTransition(async () => {
      const result = await updateRadarItemStatus(itemId, status)
      if (result.error) onError?.(result.error)
      else router.refresh()
    })
  }

  function handleDraft(platform: 'linkedin' | 'instagram' | 'x', content_type: 'text_post' | 'short_post' | 'carousel') {
    startTransition(async () => {
      const result = await createContentDraft({ radar_item_id: itemId, platform, content_type })
      if (result.error) onError?.(result.error)
      else {
        router.push(`/internal/radar/content-ideas`)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI</p>
        <Button variant="outline" size="sm" onClick={handleClassify} disabled={isPending} className="w-full">
          {isPending ? 'Processing…' : 'Classify with AI'}
        </Button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_TRANSITIONS.filter(t => t.status !== currentStatus).map(t => (
            <Button
              key={t.status}
              variant={t.variant ?? 'outline'}
              size="sm"
              onClick={() => handleStatus(t.status)}
              disabled={isPending}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Create Draft</p>
        <div className="flex flex-wrap gap-2">
          {CONTENT_DRAFTS.map(d => (
            <Button
              key={`${d.platform}-${d.content_type}`}
              variant="outline"
              size="sm"
              onClick={() => handleDraft(d.platform, d.content_type)}
              disabled={isPending}
            >
              {d.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
