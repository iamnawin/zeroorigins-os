'use client'

import { useState } from 'react'
import { Bot, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { testTogetherConnection } from '@/lib/actions/ai-assist'

export function AiConnectionTester() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleTest() {
    setLoading(true)
    setMessage('')
    setError('')
    const result = await testTogetherConnection()
    if (result.error) {
      setError(result.error)
    } else {
      setMessage(`${result.data?.reply ?? 'Connected.'} Model: ${result.data?.model}`)
    }
    setLoading(false)
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-zo-chrome">
            <Bot className="h-4 w-4 text-zo-purple-2" />
            Together AI
          </div>
          {(message || error) && (
            <p className={`mt-1 text-xs ${error ? 'text-red-400' : 'text-zo-muted'}`}>
              {error || message}
            </p>
          )}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={handleTest} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
          Test AI
        </Button>
      </CardContent>
    </Card>
  )
}
