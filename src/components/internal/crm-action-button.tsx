'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  convertLeadToDeal,
  createProjectFromCustomer,
  markProposalAccepted,
} from '@/lib/actions/internal-resources'

interface Props {
  label: string
  pendingLabel?: string
  action: 'convertLeadToDeal' | 'markProposalAccepted' | 'createProjectFromCustomer'
  resourceId: string
  redirectTo?: (id: string) => string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm'
}

export function CrmActionButton({
  label,
  pendingLabel = 'Working...',
  action,
  resourceId,
  redirectTo,
  variant = 'outline',
  size = 'sm',
}: Props) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function run() {
    setPending(true)
    setError('')
    const result =
      action === 'convertLeadToDeal'
        ? await convertLeadToDeal(resourceId)
        : action === 'markProposalAccepted'
          ? await markProposalAccepted(resourceId)
          : await createProjectFromCustomer(resourceId)
    if (result.error) {
      setError(result.error)
      setPending(false)
      return
    }
    if (result.id && redirectTo) {
      router.push(redirectTo(result.id))
    }
    router.refresh()
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button type="button" variant={variant} size={size} disabled={pending} onClick={run}>
        {pending ? pendingLabel : label}
      </Button>
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </span>
  )
}
