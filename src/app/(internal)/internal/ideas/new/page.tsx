'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewIdeaPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('ideas').insert({
      title, description, priority, status: 'draft',
      owner_id: user?.id, created_by: user?.id,
    })
    router.push('/internal/ideas')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-zo-chrome">New Idea</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="What&#39;s the idea?" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe it..." />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Idea'}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
