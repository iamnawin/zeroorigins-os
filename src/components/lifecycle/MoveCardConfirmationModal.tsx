'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { LifecycleColumnId } from './types'

type Props = {
  open: boolean
  saving: boolean
  title: string
  fromColumn: LifecycleColumnId
  toColumn: LifecycleColumnId
  statusChange: string
  warning?: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function MoveCardConfirmationModal({
  open,
  saving,
  title,
  fromColumn,
  toColumn,
  statusChange,
  warning,
  onOpenChange,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Confirm this move before changing the saved lifecycle state.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-lg border border-border bg-background/60 p-3 text-sm">
          <p><span className="text-muted-foreground">where the card came from:</span> {label(fromColumn)}</p>
          <p><span className="text-muted-foreground">where it is going:</span> {label(toColumn)}</p>
          <p><span className="text-muted-foreground">what status will change:</span> {statusChange}</p>
          {warning && <p className="text-destructive">{warning}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button type="button" onClick={onConfirm} disabled={saving}>{saving ? 'Saving...' : 'Confirm Move'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function label(value: LifecycleColumnId) {
  return value.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}
