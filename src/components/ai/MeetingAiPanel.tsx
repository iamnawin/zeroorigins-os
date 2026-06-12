'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { generateMeetingAiAssist } from '@/lib/actions/ai-assist'

export function MeetingAiPanel({ meetingId }: { meetingId: string }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleGenerate() {
    setLoading(true)
    setMessage('')
    setError('')
    const result = await generateMeetingAiAssist(meetingId)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    setMessage('AI summary and next action saved.')
    setLoading(false)
    router.refresh()
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-zo-chrome">
          <Bot className="h-4 w-4 text-zo-purple-2" />
          AI Assist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button type="button" size="sm" onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
          Save Summary
        </Button>
        {(message || error) && (
          <p className={`text-sm ${error ? 'text-red-400' : 'text-zo-muted'}`}>
            {error || message}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
