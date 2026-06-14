'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  APPLICATION_STAGES,
  APPLICATION_STATUSES,
  APPLICATION_TYPES,
  type Application,
  type ApplicationStage,
  type ApplicationStatus,
  type ApplicationType,
  type BusinessVertical,
} from '@/types'
import { createApplication, updateApplication } from '@/lib/actions/internal-resources'

type Props = {
  initialData?: Partial<Application>
  verticals?: Pick<BusinessVertical, 'id' | 'name'>[]
}

export function ApplicationForm({ initialData, verticals = [] }: Props) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    slug: initialData?.slug ?? '',
    description: initialData?.description ?? '',
    vertical_id: initialData?.vertical_id ?? '',
    stage: initialData?.stage ?? 'prototype',
    status: initialData?.status ?? 'active',
    type: initialData?.type ?? 'application',
    repo_url: initialData?.repo_url ?? '',
    local_folder_path: initialData?.local_folder_path ?? '',
    docs_url: initialData?.docs_url ?? '',
    docs_folder_path: initialData?.docs_folder_path ?? '',
    website_url: initialData?.website_url ?? '',
    deployment_url: initialData?.deployment_url ?? '',
    database_url: initialData?.database_url ?? '',
    n8n_workflow_url: initialData?.n8n_workflow_url ?? '',
    figma_url: initialData?.figma_url ?? '',
    tech_stack: initialData?.tech_stack?.join(', ') ?? '',
    build_status: initialData?.build_status ?? '',
    next_action: initialData?.next_action ?? '',
    notes: initialData?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(value => ({ ...value, [key]: event.target.value }))

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      stage: form.stage as ApplicationStage,
      status: form.status as ApplicationStatus,
      type: form.type as ApplicationType,
    }

    const result = initialData?.id
      ? await updateApplication(initialData.id, payload)
      : await createApplication(payload)

    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    router.push(result.id ? `/internal/applications/${result.id}` : '/internal/applications')
    router.refresh()
  }

  return (
    <Card className="max-w-4xl border-border bg-card">
      <CardHeader>
        <CardTitle>{initialData?.id ? 'Edit Application' : 'New Application'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={set('name')} required placeholder="PlotDNA" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={set('slug')} placeholder="auto-generated if empty" />
            </div>
            <div className="space-y-2">
              <Label>Build Status</Label>
              <Input value={form.build_status} onChange={set('build_status')} placeholder="production ready" />
            </div>
            <div className="space-y-2">
              <Label>Business Vertical</Label>
              <select value={form.vertical_id} onChange={set('vertical_id')} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
                <option value="">No vertical</option>
                {verticals.map(vertical => <option key={vertical.id} value={vertical.id}>{vertical.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <select value={form.stage} onChange={set('stage')} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
                {APPLICATION_STAGES.map(stage => <option key={stage} value={stage}>{stage.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={form.status} onChange={set('status')} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
                {APPLICATION_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select value={form.type} onChange={set('type')} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
                {APPLICATION_TYPES.map(type => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tech Stack</Label>
              <Input value={form.tech_stack} onChange={set('tech_stack')} placeholder="Next.js, Supabase, n8n" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={set('description')} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Next Action</Label>
            <Input value={form.next_action} onChange={set('next_action')} placeholder="Package demo, connect repo, define MVP..." />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="GitHub Repo" value={form.repo_url} onChange={set('repo_url')} placeholder="https://github.com/..." />
            <Field label="Local Folder" value={form.local_folder_path} onChange={set('local_folder_path')} placeholder="D:\AI-Workspace\Repos\..." />
            <Field label="Docs URL" value={form.docs_url} onChange={set('docs_url')} placeholder="https://..." />
            <Field label="Docs Folder" value={form.docs_folder_path} onChange={set('docs_folder_path')} placeholder="D:\AI-Workspace\Docs\..." />
            <Field label="Website" value={form.website_url} onChange={set('website_url')} placeholder="https://..." />
            <Field label="Deployment" value={form.deployment_url} onChange={set('deployment_url')} placeholder="https://app.vercel.app" />
            <Field label="Database" value={form.database_url} onChange={set('database_url')} placeholder="Supabase project or DB URL" />
            <Field label="n8n Workflow" value={form.n8n_workflow_url} onChange={set('n8n_workflow_url')} placeholder="https://..." />
            <Field label="Figma" value={form.figma_url} onChange={set('figma_url')} placeholder="https://figma.com/..." />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={set('notes')} rows={4} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">{saving ? 'Saving...' : 'Save Application'}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  )
}
