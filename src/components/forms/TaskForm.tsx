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
  const [priority, setPriority] = useState<string>(String(initialData?.priority ?? 'normal'))
  const [dueAt, setDueAt] = useState(toDatetimeLocal(String(initialData?.due_at ?? initialData?.due_date ?? '')))
  const [reminderEnabled, setReminderEnabled] = useState(Boolean(initialData?.reminder_enabled))
  const [reminderAt, setReminderAt] = useState(toDatetimeLocal(String(initialData?.reminder_at ?? '')))
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
        priority: priority as 'low' | 'normal' | 'high' | 'urgent',
        due_at: fromDatetimeLocal(dueAt),
        reminder_enabled: reminderEnabled,
        reminder_at: reminderEnabled ? fromDatetimeLocal(reminderAt || dueAt) : null,
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
    <div className="max-w-3xl">
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Project (optional)</Label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">No project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="low">Low</option>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Due date and time</Label>
                <Input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} />
              </div>
              <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={e => setReminderEnabled(e.target.checked)}
                    className="h-4 w-4 accent-zo-purple"
                  />
                  Reminder
                </label>
                <Input
                  type="datetime-local"
                  value={reminderAt || dueAt}
                  onChange={e => setReminderAt(e.target.value)}
                  disabled={!reminderEnabled}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground">In-app notification for now. Browser and Telegram fallback come later.</p>
              </div>
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

function toDatetimeLocal(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.length === 10 ? `${value}T09:00` : ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function fromDatetimeLocal(value: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}
