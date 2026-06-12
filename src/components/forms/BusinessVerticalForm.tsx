'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BUSINESS_VERTICAL_STATUSES, BUSINESS_VERTICAL_TYPES, type BusinessVertical } from '@/types'
import { createBusinessVertical, updateBusinessVertical } from '@/lib/actions/internal-resources'

export function BusinessVerticalForm({ initialData }: { initialData?: Partial<BusinessVertical> }) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    slug: initialData?.slug ?? '',
    type: initialData?.type ?? 'internal',
    status: initialData?.status ?? 'idea',
    description: initialData?.description ?? '',
    owner: initialData?.owner ?? '',
    website: initialData?.website ?? '',
    logo_url: initialData?.logo_url ?? '',
    brand_color: initialData?.brand_color ?? '',
    notes: initialData?.notes ?? '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const set = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(value => ({ ...value, [key]: event.target.value }))

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const result = initialData?.id
      ? await updateBusinessVertical(initialData.id, form)
      : await createBusinessVertical(form)

    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    router.push(result.id ? `/internal/business-verticals/${result.id}` : '/internal/business-verticals')
    router.refresh()
  }

  return (
    <Card className="max-w-3xl border-border bg-card">
      <CardHeader>
        <CardTitle>{initialData?.id ? 'Edit Business Vertical' : 'New Business Vertical'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={set('name')} required placeholder="AIWithNoBrain" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={set('slug')} placeholder="auto-generated if empty" />
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Input value={form.owner} onChange={set('owner')} placeholder="Naveen" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select value={form.type} onChange={set('type')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {BUSINESS_VERTICAL_TYPES.map(type => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={form.status} onChange={set('status')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {BUSINESS_VERTICAL_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={set('website')} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Brand Color</Label>
              <Input value={form.brand_color} onChange={set('brand_color')} placeholder="#8b5cf6" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={set('description')} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={set('notes')} rows={4} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Vertical'}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
