'use client'

import { cn } from '@/lib/utils'
import { DraggableLifecycleCard } from './DraggableLifecycleCard'
import type { DropZoneState, LifecycleCard, LifecycleColumn as LifecycleColumnType, LifecycleColumnId } from './types'

type Props = {
  column: LifecycleColumnType
  cards: LifecycleCard[]
  dropState: DropZoneState
  draggingId?: string | null
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
        'min-h-[22rem] w-[18rem] shrink-0 rounded-xl border border-border bg-background/50 p-3 transition-colors',
        dropState === 'active' && 'border-zo-purple/40 bg-zo-purple/5',
        dropState === 'valid' && 'border-zo-purple/70 bg-zo-purple/10 shadow-lg shadow-zo-purple/10',
        dropState === 'invalid' && 'border-destructive/50 bg-destructive/5 opacity-70',
      )}
    >
      <div className="mb-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{column.label}</h3>
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{cards.length}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{column.description}</p>
      </div>

      <div className="space-y-2">
        {cards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          cards.map(card => (
            <DraggableLifecycleCard
              key={`${card.type}:${card.item.id}`}
              card={card}
              columnId={column.id}
              draggingId={draggingId}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </section>
  )
}
