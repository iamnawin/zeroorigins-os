'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SyncCalendarButton() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleSync() {
    setSyncing(true)
    setResult(null)
    try {
      const res = await fetch('/api/calendar/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setResult([data.error, data.details].filter(Boolean).join(': ') || 'Sync failed')
      } else {
        setResult(`Synced: ${data.created} new, ${data.updated} updated`)
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch {
      setResult('Network error')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
        <RefreshCw className={`mr-1 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing...' : 'Sync Now'}
      </Button>
      {result && <span className="text-xs text-muted-foreground">{result}</span>}
    </div>
  )
}
