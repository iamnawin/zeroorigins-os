'use client'

import Link from 'next/link'
import { AppWindow, ExternalLink, GripVertical, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'
import type { LifecycleCard, LifecycleColumnId } from './types'

type Props = {
  card: LifecycleCard
  columnId: LifecycleColumnId
  draggingId?: string | null
  onDragStart: (card: LifecycleCard, columnId: LifecycleColumnId) => void
  onDragEnd: () => void
}

export function DraggableLifecycleCard({ card, columnId, draggingId, onDragStart, onDragEnd }: Props) {
  const item = card.item
  const dragId = `${card.type}:${item.id}`
  const isDragging = draggingId === dragId
  const href = card.type === 'idea' ? `/internal/ideas/${item.id}` : `/internal/applications/${item.id}`
  const title = card.type === 'idea' ? card.item.title : card.item.name
  const description = card.item.description
  const owner = card.item.owner?.full_name || card.item.owner?.email || 'Unassigned'

  return (
    <div
      draggable
      data-dragging={isDragging ? 'true' : 'false'}
      onDragStart={event => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', JSON.stringify({ type: card.type, id: item.id, fromColumn: columnId }))
        onDragStart(card, columnId)
      }}
      onDragEnd={onDragEnd}
      className={cn(
        'zo-grid-reveal-card group rounded-lg border border-border bg-card p-3 shadow-sm',
        'cursor-grab select-none transition-all duration-100',
        'hover:-translate-y-0.5 hover:border-border/70 hover:shadow-md hover:shadow-black/15',
        isDragging && 'cursor-grabbing scale-[1.02] border-zo-purple/70 shadow-lg shadow-zo-purple/20 opacity-75',
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 text-muted-foreground/40 group-hover:text-zo-purple/60 transition-colors">
          <GripVertical className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          {/* Title + type icon */}
          <div className="flex items-start justify-between gap-2">
            <Link
              href={href}
              onClick={e => e.stopPropagation()}
              className="line-clamp-1 text-sm font-semibold text-foreground hover:text-zo-purple-2 transition-colors"
            >
              {title}
            </Link>
            {card.type === 'idea'
              ? <Lightbulb className="h-3.5 w-3.5 shrink-0 text-yellow-400/80" />
              : <AppWindow className="h-3.5 w-3.5 shrink-0 text-zo-purple/70" />}
          </div>

          {/* Description */}
          {description && (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/70">
              {description}
            </p>
          )}

          {/* Status + vertical badges */}
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <StatusBadge value={card.type === 'idea' ? card.item.status : card.item.stage} />
            {card.item.vertical && (
              <span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
                {card.item.vertical.name}
              </span>
            )}
          </div>

          {/* Owner / next action */}
          <div className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
            <p>Owner: {owner}</p>
            {card.item.next_action && (
              <p className="line-clamp-1">
                <span className="text-foreground/80">Next:</span> {card.item.next_action}
              </p>
            )}
            {card.type === 'idea' && (card.item.promoted_application || card.item.linked_application) && (
              <p className="line-clamp-1">
                <span className="text-foreground/80">App:</span>{' '}
                {(card.item.promoted_application || card.item.linked_application)?.name}
              </p>
            )}
            {card.type === 'application' && card.item.source_idea && (
              <p className="line-clamp-1">
                <span className="text-foreground/80">Source:</span> {card.item.source_idea.title}
              </p>
            )}
          </div>

          {/* Footer chips */}
          {card.type === 'application' && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <SourceDot label="Repo" connected={!!card.item.repo_url} />
              <SourceDot label="Local" connected={!!card.item.local_folder_path} />
              <SourceDot label="Docs" connected={!!(card.item.docs_url || card.item.docs_folder_path)} />
              <SourceDot label="Deploy" connected={!!card.item.deployment_url} />
              <SourceDot label="DB" connected={!!card.item.database_url} />
              <SourceDot label="n8n" connected={!!card.item.n8n_workflow_url} />
              <SourceDot label="Site" connected={!!card.item.website_url} />
              {(card.item.website_url || card.item.deployment_url) && (
                <ExternalLink className="h-2.5 w-2.5 text-zo-purple-2/60" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SourceDot({ label, connected }: { label: string; connected: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px]',
      connected ? 'border-green-500/25 text-green-400/80' : 'border-border/40 text-muted-foreground/35',
    )}>
      <span className={cn('h-1 w-1 rounded-full', connected ? 'bg-green-500/80' : 'bg-muted-foreground/25')} />
      {label}
    </span>
  )
}
