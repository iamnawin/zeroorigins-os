'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PROJECT_STATUSES, type Project } from '@/types'
import { createProject, updateProject } from '@/lib/actions/internal-resources'

const PRIORITIES = ['low', 'medium', 'high', 'critical']

interface Props {
  mode: 'create' | 'edit'
  initialData?: Partial<Project>
}

export default function ProjectForm({ mode, initialData }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [priority, setPriority] = useState<string>(initialData?.priority ?? 'medium')
  const [status, setStatus] = useState<string>(initialData?.status ?? 'draft')
  const [startDate, setStartDate] = useState(initialData?.start_date ?? '')
  const [targetDate, setTargetDate] = useState(initialData?.target_date ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        title,
        description,
        priority: priority as Project['priority'],
        status: status as Project['status'],
        start_date: startDate || null,
        target_date: targetDate || null,
      }
      const result = mode === 'create'
        ? await createProject(payload)
        : await updateProject(initialData!.id!, payload)

      if (result.error) throw new Error(result.error)

      if (mode === 'create') {
        router.push('/internal/projects')
      } else {
        router.push(`/internal/projects/${initialData!.id}`)
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
          <CardTitle className="text-zo-chrome">{mode === 'create' ? 'New Project' : 'Edit Project'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Project name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="What is this project about?" />
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
                    {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              )}
            </div>
            {mode === 'edit' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : mode === 'create' ? 'Create Project' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
