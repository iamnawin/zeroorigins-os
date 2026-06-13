'use client'

import { useState } from 'react'
import { Archive, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { archiveApplication, deleteApplication } from '@/lib/actions/internal-resources'

type Props = {
  applicationId: string
  applicationName: string
  archived: boolean
}

export function ApplicationDangerActions({ applicationId, applicationName, archived }: Props) {
  const [pendingAction, setPendingAction] = useState<'archive' | 'delete' | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  async function archive() {
    setPendingAction('archive')
    setError('')
    const result = await archiveApplication(applicationId)
    if (result.error) {
      setError(result.error)
      setPendingAction(null)
      return
    }
    router.refresh()
    setPendingAction(null)
  }

  async function remove() {
    const confirmed = window.confirm(
      `Delete "${applicationName}" permanently from ZeroOrigins OS? If the local folder still exists, workspace sync can create it again later.`,
    )
    if (!confirmed) return

    setPendingAction('delete')
    setError('')
    const result = await deleteApplication(applicationId)
    if (result.error) {
      setError(result.error)
      setPendingAction(null)
      return
    }
    router.push('/internal/applications')
    router.refresh()
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
      <div className="flex flex-col gap-2 sm:flex-row">
        {!archived && (
          <Button type="button" variant="outline" size="sm" onClick={archive} disabled={pendingAction !== null}>
            <Archive className="h-3.5 w-3.5" />
            {pendingAction === 'archive' ? 'Archiving...' : 'Archive application'}
          </Button>
        )}
        <Button type="button" variant="destructive" size="sm" onClick={remove} disabled={pendingAction !== null}>
          <Trash2 className="h-3.5 w-3.5" />
          {pendingAction === 'delete' ? 'Deleting...' : 'Delete permanently'}
        </Button>
      </div>
      {error && <p className="max-w-xs text-xs text-red-500">{error}</p>}
    </div>
  )
}
