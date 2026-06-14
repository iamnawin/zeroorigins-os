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
        'zo-grid-reveal-card group rounded-lg border border-border bg-card p-3 shadow-sm transition-all duration-150',
        'hover:bg-card/90',
        isDragging && 'scale-[1.02] border-zo-purple/70 shadow-lg shadow-zo-purple/20 opacity-80',
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-muted-foreground/60 group-hover:text-zo-purple">
          <GripVertical className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={href} className="line-clamp-2 text-sm font-semibold text-foreground hover:text-zo-purple-2">
              {title}
            </Link>
            {card.type === 'idea' ? <Lightbulb className="h-4 w-4 shrink-0 text-yellow-300" /> : <AppWindow className="h-4 w-4 shrink-0 text-zo-purple" />}
          </div>

          {description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{description}</p>}

          <div className="mt-3 flex flex-wrap gap-1.5">
            <StatusBadge value={card.type === 'idea' ? card.item.status : card.item.stage} />
            {card.item.vertical && <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{card.item.vertical.name}</span>}
          </div>

          <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
            <p>Owner: {owner}</p>
            {card.item.next_action && <p><span className="text-foreground">Next:</span> {card.item.next_action}</p>}
            {card.type === 'idea' && (card.item.promoted_application || card.item.linked_application) && (
              <p><span className="text-foreground">Promoted to application:</span> {(card.item.promoted_application || card.item.linked_application)?.name}</p>
            )}
            {card.type === 'application' && card.item.source_idea && (
              <p><span className="text-foreground">Source:</span> {card.item.source_idea.title}</p>
            )}
          </div>

          {card.type === 'application' && (
            <div className="mt-3 flex flex-wrap gap-1">
              <SourceDot label="Repo" connected={!!card.item.repo_url} />
              <SourceDot label="Local" connected={!!card.item.local_folder_path} />
              <SourceDot label="Docs" connected={!!(card.item.docs_url || card.item.docs_folder_path)} />
              <SourceDot label="Deploy" connected={!!card.item.deployment_url} />
              <SourceDot label="DB" connected={!!card.item.database_url} />
              <SourceDot label="n8n" connected={!!card.item.n8n_workflow_url} />
              <SourceDot label="Site" connected={!!card.item.website_url} />
              {(card.item.website_url || card.item.deployment_url) && <ExternalLink className="h-3 w-3 text-zo-purple-2" />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SourceDot({ label, connected }: { label: string; connected: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] ${connected ? 'border-green-500/30 text-green-400' : 'border-border text-muted-foreground/50'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
      {label}
    </span>
  )
}
