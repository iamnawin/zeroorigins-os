'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteMeeting } from '@/lib/actions/internal-resources'

export function DeleteMeetingButton({ meetingId }: { meetingId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    const result = await deleteMeeting(meetingId)
    if (result.error) {
      setLoading(false)
      setConfirming(false)
    } else {
      router.push('/internal/meetings')
      router.refresh()
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-400">Delete this meeting?</span>
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading}>
          {loading ? 'Deleting...' : 'Confirm'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>Cancel</Button>
      </div>
    )
  }

  return (
    <Button size="sm" variant="outline" onClick={() => setConfirming(true)} className="text-red-400 border-red-400/30 hover:bg-red-400/10">
      <Trash2 className="w-4 h-4 mr-1" />Delete
    </Button>
  )
}
