'use client'

import { cn } from '@/lib/utils'
import { GridRevealItem } from '@/components/ui/grid-reveal'
import { DraggableLifecycleCard } from './DraggableLifecycleCard'
import type { DropZoneState, LifecycleCard, LifecycleColumn as LifecycleColumnType, LifecycleColumnId } from './types'

type Props = {
  column: LifecycleColumnType
  cards: LifecycleCard[]
  dropState: DropZoneState
  draggingId?: string | null
  isDraggingAny?: boolean
  onDragStart: (card: LifecycleCard, columnId: LifecycleColumnId) => void
  onDragEnd: () => void
  onDrop: (columnId: LifecycleColumnId) => void
  onDragOver: (columnId: LifecycleColumnId) => void
  emptyText: string
}

export function LifecycleColumn({
  column,
  cards,
  dropState,
  draggingId,
  isDraggingAny,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  emptyText,
}: Props) {
  return (
    <section
      data-drop-state={dropState}
      onDragOver={event => {
        event.preventDefault()
        onDragOver(column.id)
      }}
      onDrop={event => {
        event.preventDefault()
        onDrop(column.id)
      }}
      className={cn(
        'w-[17rem] flex-shrink-0 rounded-xl border p-3 transition-all duration-150',
        cards.length === 0 ? 'min-h-[8rem]' : 'min-h-[20rem]',
        dropState === 'idle' && 'border-border bg-background/50',
        dropState === 'active' && 'border-border/60 bg-background/50',
        dropState === 'valid' && 'border-zo-purple/60 bg-zo-purple/8 shadow-md shadow-zo-purple/10',
        dropState === 'invalid' && 'border-destructive/40 bg-destructive/5 opacity-60',
      )}
    >
      <div className="mb-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{column.label}</h3>
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{cards.length}</span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground/70">{column.description}</p>
      </div>

      <div className="space-y-2">
        {cards.length === 0 ? (
          <div className={cn(
            'flex min-h-[5rem] items-center justify-center rounded-lg border border-dashed p-3 text-center transition-colors',
            dropState === 'valid'
              ? 'border-zo-purple/50 bg-zo-purple/5 text-zo-purple-2'
              : isDraggingAny
              ? 'border-border/50 text-muted-foreground/40'
              : 'border-border/30 text-muted-foreground/30',
          )}>
            <p className="text-[11px] leading-relaxed">{emptyText}</p>
          </div>
        ) : (
          cards.map((card, index) => (
            <GridRevealItem key={`${card.type}:${card.item.id}`} index={index}>
              <DraggableLifecycleCard
                card={card}
                columnId={column.id}
                draggingId={draggingId}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            </GridRevealItem>
          ))
        )}
      </div>
    </section>
  )
}
