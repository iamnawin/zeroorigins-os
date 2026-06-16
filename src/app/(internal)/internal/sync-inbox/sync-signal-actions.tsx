'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ignoreSyncSignal } from '@/lib/actions/sync-inbox'
import type { SyncSignal } from '@/types'

export function SyncSignalActions({ signal }: { signal: SyncSignal }) {
  const [loading, setLoading] = useState(false)

  if (signal.status !== 'new' && signal.status !== 'needs_review') return null

  async function handleIgnore() {
    setLoading(true)
    await ignoreSyncSignal(signal.id)
    setLoading(false)
  }

  const isMeetingType = !signal.suggested_record_type || signal.suggested_record_type === 'meeting'

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {isMeetingType && (
        <Link href="/internal/meetings/new">
          <Button size="sm" variant="outline" className="h-7 text-xs">Create Meeting</Button>
        </Link>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-muted-foreground hover:text-foreground"
        onClick={handleIgnore}
        disabled={loading}
      >
        {loading ? '…' : 'Ignore'}
      </Button>
    </div>
  )
}
