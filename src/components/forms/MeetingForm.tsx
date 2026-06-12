'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MEETING_STATUSES, type Meeting } from '@/types'
import { createMeeting, updateMeeting } from '@/lib/actions/internal-resources'

interface LinkOption {
  id: string
  label: string
}

interface Props {
  mode: 'create' | 'edit'
  initialData?: Partial<Meeting>
  owners?: LinkOption[]
  leads?: LinkOption[]
  deals?: LinkOption[]
  customers?: LinkOption[]
  projects?: LinkOption[]
}

function toLocalDateTime(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export default function MeetingForm({
  mode,
  initialData,
  owners = [],
  leads = [],
  deals = [],
  customers = [],
  projects = [],
}: Props) {
  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    entity_type: initialData?.entity_type ?? 'internal',
    lead_id: initialData?.lead_id ?? '',
    deal_id: initialData?.deal_id ?? '',
    customer_id: initialData?.customer_id ?? '',
    project_id: initialData?.project_id ?? '',
    scheduled_at: toLocalDateTime(initialData?.scheduled_at),
    duration_minutes: initialData?.duration_minutes?.toString() ?? '30',
    attendees: initialData?.attendees?.join(', ') ?? '',
    agenda: initialData?.agenda ?? '',
    outcome: initialData?.outcome ?? '',
    next_action: initialData?.next_action ?? '',
    owner_id: initialData?.owner_id ?? '',
  })
  const [status, setStatus] = useState<string>(initialData?.status ?? 'scheduled')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const set = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(value => ({ ...value, [key]: event.target.value }))

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        ...form,
        entity_type: (form.lead_id ? 'lead' : form.deal_id ? 'deal' : form.customer_id ? 'customer' : form.project_id ? 'project' : form.entity_type) as Meeting['entity_type'],
        entity_id: form.lead_id || form.deal_id || form.customer_id || form.project_id || null,
        lead_id: form.lead_id || null,
        deal_id: form.deal_id || null,
        customer_id: form.customer_id || null,
        project_id: form.project_id || null,
        owner_id: form.owner_id || null,
        status: status as Meeting['status'],
      }
      const result = mode === 'create'
        ? await createMeeting(payload)
        : await updateMeeting(initialData!.id!, payload)

      if (result.error) throw new Error(result.error)

      router.push(mode === 'create' ? '/internal/meetings' : `/internal/meetings/${initialData!.id}`)
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
          <CardTitle className="text-zo-chrome">{mode === 'create' ? 'New Meeting' : 'Edit Meeting'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={set('title')} required placeholder="Discovery call, proposal review..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scheduled Time</Label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={set('scheduled_at')} required />
              </div>
              <div className="space-y-2">
                <Label>Duration Minutes</Label>
                <Input type="number" min="1" value={form.duration_minutes} onChange={set('duration_minutes')} />
              </div>
              <div className="space-y-2">
                <Label>Owner</Label>
                <select value={form.owner_id} onChange={set('owner_id')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Me</option>
                  {owners.map(row => <option key={row.id} value={row.id}>{row.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Lead</Label>
                <select value={form.lead_id} onChange={set('lead_id')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">No lead</option>
                  {leads.map(row => <option key={row.id} value={row.id}>{row.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Deal</Label>
                <select value={form.deal_id} onChange={set('deal_id')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">No deal</option>
                  {deals.map(row => <option key={row.id} value={row.id}>{row.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Customer</Label>
                <select value={form.customer_id} onChange={set('customer_id')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">No customer</option>
                  {customers.map(row => <option key={row.id} value={row.id}>{row.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <select value={form.project_id} onChange={set('project_id')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">No project</option>
                  {projects.map(row => <option key={row.id} value={row.id}>{row.label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Attendees</Label>
              <Input value={form.attendees} onChange={set('attendees')} placeholder="name@email.com, teammate@zeroorigins.in" />
            </div>
            <div className="space-y-2">
              <Label>Agenda</Label>
              <Textarea value={form.agenda} onChange={set('agenda')} rows={3} />
            </div>
            {mode === 'edit' && (
              <>
                <div className="space-y-2">
                  <Label>Outcome</Label>
                  <Textarea value={form.outcome} onChange={set('outcome')} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Next Action</Label>
                  <Input value={form.next_action} onChange={set('next_action')} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select value={status} onChange={event => setStatus(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                    {MEETING_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : mode === 'create' ? 'Create Meeting' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
