'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IDEA_STATUSES, type Idea } from '@/types'
import { createIdea, updateIdea } from '@/lib/actions/internal-resources'

const PRIORITIES = ['low', 'medium', 'high', 'critical']

interface Props {
  mode: 'create' | 'edit'
  initialData?: Partial<Idea>
}

export default function IdeaForm({ mode, initialData }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [priority, setPriority] = useState<string>(initialData?.priority ?? 'medium')
  const [status, setStatus] = useState<string>(initialData?.status ?? 'draft')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = mode === 'create'
        ? await createIdea({ title, description, priority: priority as Idea['priority'] })
        : await updateIdea(initialData!.id!, {
          title,
          description,
          priority: priority as Idea['priority'],
          status: status as Idea['status'],
        })

      if (result.error) throw new Error(result.error)

      router.push(mode === 'create' ? '/internal/ideas' : `/internal/ideas/${initialData!.id}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-zo-chrome">{mode === 'create' ? 'New Idea' : 'Edit Idea'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="What's the idea?" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe it..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {mode === 'edit' && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                    {IDEA_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : mode === 'create' ? 'Create Idea' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
