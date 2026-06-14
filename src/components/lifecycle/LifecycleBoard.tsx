'use client'

import { useMemo, useState } from 'react'
import { LifecycleColumn } from './LifecycleColumn'
import { MoveCardConfirmationModal } from './MoveCardConfirmationModal'
import { PromoteIdeaModal } from './PromoteIdeaModal'
import { useLifecycleMove } from './useLifecycleMove'
import type { DropZoneState, LifecycleApplication, LifecycleCard, LifecycleColumn as LifecycleColumnType, LifecycleColumnId, LifecycleIdea } from './types'

const COLUMNS: LifecycleColumnType[] = [
  { id: 'ideas', label: 'Ideas', description: 'Raw concepts and early signals.' },
  { id: 'evaluating', label: 'Evaluating', description: 'Worth reviewing or validating.' },
  { id: 'experiment', label: 'Experiment', description: 'Small tests and proofs.' },
  { id: 'prototype', label: 'Prototype', description: 'Usable early product shape.' },
  { id: 'application', label: 'Application', description: 'Actual product or tool.' },
  { id: 'production_ready', label: 'Production Ready', description: 'Ready for packaging or demos.' },
  { id: 'live', label: 'Live', description: 'Public, deployed, or actively used.' },
  { id: 'archived', label: 'Archived', description: 'Paused from active lifecycle.' },
]

type Props = {
  ideas: LifecycleIdea[]
  applications: LifecycleApplication[]
  verticals: { id: string; name: string }[]
}

export function LifecycleBoard({ ideas, applications, verticals }: Props) {
  const initialCards = useMemo<LifecycleCard[]>(() => [
    ...ideas.map(item => ({ type: 'idea' as const, item })),
    ...applications.map(item => ({ type: 'application' as const, item })),
  ], [ideas, applications])
  const {
    cards,
    pendingMove,
    toast,
    isPending,
    requestMove,
    confirmPromotion,
    confirmRevert,
    clearPendingMove,
    clearToast,
  } = useLifecycleMove(initialCards)
  const [dragging, setDragging] = useState<{ card: LifecycleCard; fromColumn: LifecycleColumnId } | null>(null)
  const [hoverColumn, setHoverColumn] = useState<LifecycleColumnId | null>(null)

  const grouped = useMemo(() => groupCards(cards), [cards])
  const draggingId = dragging ? `${dragging.card.type}:${dragging.card.item.id}` : null

  function dropState(columnId: LifecycleColumnId): DropZoneState {
    if (!dragging) return 'idle'
    if (hoverColumn !== columnId) return 'active'
    return isValidMove(dragging.card, dragging.fromColumn, columnId) ? 'valid' : 'invalid'
  }

  function handleDrop(toColumn: LifecycleColumnId) {
    if (!dragging) return
    const move = { card: dragging.card, fromColumn: dragging.fromColumn, toColumn }
    setDragging(null)
    setHoverColumn(null)
    if (!isValidMove(move.card, move.fromColumn, move.toColumn)) {
      return
    }
    requestMove(move)
  }

  const promoteIdea = pendingMove?.card.type === 'idea' ? pendingMove.card.item : null
  const confirmMove = pendingMove?.card.type === 'application' ? pendingMove : null

  return (
    <section className="rounded-xl border border-border bg-card/70 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zo-purple-2">Product Lifecycle Board</p>
          <h2 className="mt-1 text-xl font-semibold">Move ideas into real products</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Drag cards through the lifecycle. Promotion and reverts ask for confirmation before changing the database.
          </p>
        </div>
        {toast && (
          <button
            type="button"
            onClick={clearToast}
            className={`rounded-md border px-3 py-2 text-left text-xs ${toast.tone === 'success' ? 'border-green-500/30 text-green-300' : 'border-destructive/40 text-destructive'}`}
          >
            {toast.message}
          </button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map(column => (
          <LifecycleColumn
            key={column.id}
            column={column}
            cards={grouped[column.id] ?? []}
            dropState={dropState(column.id)}
            draggingId={draggingId}
            onDragStart={(card, fromColumn) => {
              setDragging({ card, fromColumn })
              setHoverColumn(fromColumn)
            }}
            onDragEnd={() => {
              setDragging(null)
              setHoverColumn(null)
            }}
            onDrop={handleDrop}
            onDragOver={setHoverColumn}
            emptyText={emptyTextForColumn(column.id)}
          />
        ))}
      </div>

      <PromoteIdeaModal
        idea={promoteIdea}
        verticals={verticals}
        open={Boolean(promoteIdea)}
        saving={isPending}
        onOpenChange={open => {
          if (!open) clearPendingMove()
        }}
        onConfirm={confirmPromotion}
      />

      <MoveCardConfirmationModal
        open={Boolean(confirmMove)}
        saving={isPending}
        title="Move application back to idea flow?"
        fromColumn={confirmMove?.fromColumn ?? 'application'}
        toColumn={confirmMove?.toColumn ?? 'evaluating'}
        statusChange="Application status will become reverted_to_idea; linked source idea will move to evaluating or experiment."
        warning="Production-ready, live, or public-surface applications require stronger review before this action."
        onOpenChange={open => {
          if (!open) clearPendingMove()
        }}
        onConfirm={confirmRevert}
      />
    </section>
  )
}

function groupCards(cards: LifecycleCard[]) {
  const grouped: Record<LifecycleColumnId, LifecycleCard[]> = {
    ideas: [],
    evaluating: [],
    experiment: [],
    prototype: [],
    application: [],
    production_ready: [],
    live: [],
    archived: [],
  }

  for (const card of cards) {
    grouped[columnForCard(card)].push(card)
  }
  return grouped
}

function columnForCard(card: LifecycleCard): LifecycleColumnId {
  if (card.type === 'idea') {
    if (card.item.status === 'promoted_to_application') return 'application'
    if (['reviewing', 'evaluating', 'validated', 'approved'].includes(card.item.status)) return 'evaluating'
    if (['testing', 'experiment'].includes(card.item.status)) return 'experiment'
    if (['tested', 'prototype'].includes(card.item.status)) return 'prototype'
    if (card.item.status === 'archived' || card.item.status === 'rejected') return 'archived'
    return 'ideas'
  }

  if (card.item.status === 'archived' || card.item.stage === 'archived' || card.item.status === 'reverted_to_idea') return 'archived'
  if (card.item.stage === 'live') return 'live'
  if (card.item.stage === 'production_ready') return 'production_ready'
  if (card.item.stage === 'prototype' || card.item.stage === 'mvp' || card.item.stage === 'testing') return 'prototype'
  return 'application'
}

function isValidMove(card: LifecycleCard, fromColumn: LifecycleColumnId, toColumn: LifecycleColumnId) {
  if (fromColumn === toColumn) return false
  if (card.type === 'idea') {
    return ['ideas', 'evaluating', 'experiment', 'prototype', 'application', 'archived'].includes(toColumn)
  }
  if (toColumn === 'ideas') return ['concept', 'experiment', 'prototype', 'mvp', 'application'].includes(card.item.stage)
  if (toColumn === 'evaluating' || toColumn === 'experiment') return ['concept', 'experiment', 'prototype', 'mvp', 'application'].includes(card.item.stage)
  if (toColumn === 'archived') return card.item.stage !== 'live'
  return ['prototype', 'application', 'production_ready', 'live'].includes(toColumn)
}

function emptyTextForColumn(column: LifecycleColumnId) {
  if (column === 'ideas') return 'No ideas yet. Capture a raw concept or ask the agent to suggest business ideas.'
  return 'No applications in this stage yet. Promote an idea or add an application.'
}
