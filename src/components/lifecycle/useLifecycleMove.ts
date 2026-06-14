'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  moveLifecycleCard,
  promoteIdeaToApplication,
  revertApplicationToIdea,
  type LifecycleColumnId,
} from '@/lib/actions/lifecycle-board'
import type { LifecycleCard } from './types'

type PendingMove = {
  card: LifecycleCard
  fromColumn: LifecycleColumnId
  toColumn: LifecycleColumnId
}

type Toast = {
  tone: 'success' | 'error'
  message: string
}

export function useLifecycleMove(initialCards: LifecycleCard[]) {
  const [cards, setCards] = useState(initialCards)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [isPending, startTransition] = useTransition()

  const cardById = useMemo(() => new Map(cards.map(card => [`${card.type}:${card.item.id}`, card])), [cards])

  function moveCardOptimistically(move: PendingMove) {
    const previous = cards
    setCards(current => current.map(card => {
      if (card.type !== move.card.type || card.item.id !== move.card.item.id) return card
      if (card.type === 'idea') return { ...card, item: { ...card.item, status: ideaStatusForColumn(move.toColumn) || card.item.status } }
      return {
        ...card,
        item: {
          ...card.item,
          stage: applicationStageForColumn(move.toColumn) || card.item.stage,
          status: move.toColumn === 'archived' ? 'archived' : card.item.status,
        },
      }
    }))
    return () => setCards(previous) // rollback
  }

  function requestMove(move: PendingMove) {
    setToast(null)
    if (move.card.type === 'idea' && move.toColumn === 'application') {
      setPendingMove(move)
      return
    }
    if (move.card.type === 'application' && ['ideas', 'evaluating', 'experiment'].includes(move.toColumn)) {
      setPendingMove(move)
      return
    }

    const rollback = moveCardOptimistically(move)
    startTransition(async () => {
      const result = await moveLifecycleCard({
        cardType: move.card.type,
        cardId: move.card.item.id,
        fromColumn: move.fromColumn,
        toColumn: move.toColumn,
      })
      if (result.requiresConfirmation) {
        rollback()
        setPendingMove(move)
        return
      }
      if (result.error) {
        rollback()
        setToast({ tone: 'error', message: result.error })
        return
      }
      setToast({ tone: 'success', message: 'Lifecycle updated.' })
    })
  }

  function confirmPromotion(payload: {
    applicationName: string
    verticalId?: string
    initialStage: 'prototype' | 'mvp' | 'application'
    ownerId?: string
    nextAction?: string
  }) {
    if (!pendingMove || pendingMove.card.type !== 'idea') return
    const rollback = moveCardOptimistically(pendingMove)
    startTransition(async () => {
      const result = await promoteIdeaToApplication({
        ideaId: pendingMove.card.item.id,
        ...payload,
      })
      if (result.error) {
        rollback()
        setToast({ tone: 'error', message: result.error })
        return
      }
      setPendingMove(null)
      setToast({ tone: 'success', message: 'Idea promoted to application.' })
    })
  }

  function confirmRevert() {
    if (!pendingMove || pendingMove.card.type !== 'application') return
    const rollback = moveCardOptimistically(pendingMove)
    startTransition(async () => {
      const result = await revertApplicationToIdea({
        applicationId: pendingMove.card.item.id,
        targetIdeaStatus: pendingMove.toColumn === 'experiment' ? 'experiment' : 'evaluating',
        confirmedStrong: true,
      })
      if (result.error && !result.requiresConfirmation) {
        rollback()
        setToast({ tone: 'error', message: result.error })
        return
      }
      setPendingMove(null)
      setToast({ tone: 'success', message: 'Application reverted to idea flow.' })
    })
  }

  return {
    cards,
    cardById,
    pendingMove,
    toast,
    isPending,
    requestMove,
    confirmPromotion,
    confirmRevert,
    clearPendingMove: () => setPendingMove(null),
    clearToast: () => setToast(null),
  }
}

function ideaStatusForColumn(column: LifecycleColumnId) {
  if (column === 'ideas') return 'idea'
  if (column === 'evaluating') return 'evaluating'
  if (column === 'experiment') return 'experiment'
  if (column === 'prototype') return 'prototype'
  if (column === 'archived') return 'archived'
  return null
}

function applicationStageForColumn(column: LifecycleColumnId) {
  if (column === 'prototype') return 'prototype'
  if (column === 'application') return 'application'
  if (column === 'production_ready') return 'production_ready'
  if (column === 'live') return 'live'
  if (column === 'archived') return 'archived'
  return null
}
