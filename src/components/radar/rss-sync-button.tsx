'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { triggerRssIngest } from '@/lib/radar/actions'

export function RssSyncButton({ sourceCount }: { sourceCount: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  function handleSync() {
    setResult(null)
    startTransition(async () => {
      const res = await triggerRssIngest()
      if (res.ok) {
        setResult(`Synced ${res.total} source${res.total !== 1 ? 's' : ''}`)
        router.refresh()
      } else {
        setResult(res.error ?? 'Sync failed')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      {result && <span className="text-[11px] text-muted-foreground">{result}</span>}
      <Button
        size="sm"
        variant="outline"
        onClick={handleSync}
        disabled={isPending}
        className="text-xs"
      >
        {isPending ? 'Syncing…' : `Sync RSS (${sourceCount})`}
      </Button>
    </div>
  )
}
