'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TASK_STATUSES, type Task } from '@/types'
import { createTask, updateTask } from '@/lib/actions/internal-resources'

interface Props {
  mode: 'create' | 'edit'
  initialData?: Partial<Task>
}

export default function TaskForm({ mode, initialData }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [projectId, setProjectId] = useState(initialData?.project_id ?? '')
  const [status, setStatus] = useState<string>(initialData?.status ?? 'todo')
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.from('projects').select('id, title').order('title').then(({ data }) => {
      if (data) setProjects(data)
    })
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        title,
        description,
        project_id: projectId || null,
        status: status as Task['status'],
      }
      const result = mode === 'create'
        ? await createTask(payload)
        : await updateTask(initialData!.id!, payload)

      if (result.error) throw new Error(result.error)

      if (mode === 'create') {
        router.push('/internal/tasks')
      } else {
        router.push(`/internal/tasks/${initialData!.id}`)
      }
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
          <CardTitle className="text-zo-chrome">{mode === 'create' ? 'New Task' : 'Edit Task'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Task title" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Details..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project (optional)</Label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">No project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              {mode === 'edit' && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                    {TASK_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
