'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { LifecycleIdea } from './types'

type Props = {
  idea: LifecycleIdea | null
  verticals: { id: string; name: string }[]
  open: boolean
  saving: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: {
    applicationName: string
    verticalId?: string
    initialStage: 'prototype' | 'mvp' | 'application'
    ownerId?: string
    nextAction?: string
  }) => void
}

export function PromoteIdeaModal({ idea, verticals, open, saving, onOpenChange, onConfirm }: Props) {
  const [applicationName, setApplicationName] = useState('')
  const [verticalId, setVerticalId] = useState('')
  const [initialStage, setInitialStage] = useState<'prototype' | 'mvp' | 'application'>('prototype')
  const [nextAction, setNextAction] = useState('')

  const title = applicationName || idea?.title || ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Promote idea to application?</DialogTitle>
          <DialogDescription>
            This will create an application from this idea and keep the idea linked as the source.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="space-y-1 text-xs font-medium">
            <span>Application name</span>
            <input
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={title}
              onChange={event => setApplicationName(event.target.value)}
              placeholder={idea?.title || 'Application name'}
            />
          </label>
          <label className="space-y-1 text-xs font-medium">
            <span>Business vertical</span>
            <select
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={verticalId || idea?.vertical_id || ''}
              onChange={event => setVerticalId(event.target.value)}
            >
              <option value="">No vertical</option>
              {verticals.map(vertical => <option key={vertical.id} value={vertical.id}>{vertical.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium">
            <span>Initial status</span>
            <select
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={initialStage}
              onChange={event => setInitialStage(event.target.value as 'prototype' | 'mvp' | 'application')}
            >
              <option value="prototype">prototype</option>
              <option value="mvp">mvp</option>
              <option value="application">application</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium">
            <span>Next action</span>
            <input
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={nextAction}
              onChange={event => setNextAction(event.target.value)}
              placeholder="Package demo, connect repo, validate MVP..."
            />
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button
            type="button"
            disabled={saving || !idea}
            onClick={() => onConfirm({
              applicationName: title,
              verticalId: verticalId || idea?.vertical_id,
              initialStage,
              ownerId: idea?.owner_id,
              nextAction,
            })}
          >
            {saving ? 'Promoting...' : 'Promote to Application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
