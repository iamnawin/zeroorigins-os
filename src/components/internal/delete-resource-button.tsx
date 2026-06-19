'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  deleteBusinessIdea,
  deleteDeal,
  deleteFinanceTransaction,
  deleteLead,
  deleteProject,
  deleteProposal,
  deleteTask,
} from '@/lib/actions/internal-resources'

type DeleteKind = 'lead' | 'task' | 'deal' | 'proposal' | 'project' | 'idea' | 'finance_transaction'

const DELETE_ACTIONS = {
  lead: deleteLead,
  task: deleteTask,
  deal: deleteDeal,
  proposal: deleteProposal,
  project: deleteProject,
  idea: deleteBusinessIdea,
  finance_transaction: deleteFinanceTransaction,
} satisfies Record<DeleteKind, (id: string) => Promise<{ id?: string; error?: string }>>

const REDIRECTS: Record<DeleteKind, string> = {
  lead: '/internal/leads',
  task: '/internal/tasks',
  deal: '/internal/deals',
  proposal: '/internal/proposals',
  project: '/internal/projects',
  idea: '/internal/ideas',
  finance_transaction: '/internal/finance',
}

export function DeleteResourceButton({
  id,
  kind,
  label = 'Delete',
  stay = false,
}: {
  id: string
  kind: DeleteKind
  label?: string
  stay?: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    setError('')
    const result = await DELETE_ACTIONS[kind](id)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      setConfirming(false)
      return
    }

    if (!stay) router.push(REDIRECTS[kind])
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-red-400">Delete?</span>
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading}>
          {loading ? 'Deleting...' : 'Confirm'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={loading}>Cancel</Button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }

  return (
    <Button size="sm" variant="outline" onClick={() => setConfirming(true)} className="border-red-400/30 text-red-400 hover:bg-red-400/10">
      <Trash2 className="mr-1 h-4 w-4" />{label}
    </Button>
  )
}
