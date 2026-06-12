'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DEAL_STAGES, type Deal } from '@/types'
import { createDeal, updateDeal } from '@/lib/actions/internal-resources'

interface LeadOption {
  id: string
  name: string
  company?: string | null
}

interface Props {
  mode: 'create' | 'edit'
  initialData?: Partial<Deal>
  leads?: LeadOption[]
}

export default function DealForm({ mode, initialData, leads = [] }: Props) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    lead_id: initialData?.lead_id ?? '',
    estimated_value: initialData?.estimated_value?.toString() ?? '',
    expected_close_date: initialData?.expected_close_date ? initialData.expected_close_date.slice(0, 10) : '',
    next_step: initialData?.next_step ?? '',
    notes: initialData?.notes ?? '',
  })
  const [stage, setStage] = useState<string>(initialData?.stage ?? 'qualifying')
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
      const payload = { ...form, lead_id: form.lead_id || null, stage: stage as Deal['stage'] }
      const result = mode === 'create'
        ? await createDeal(payload)
        : await updateDeal(initialData!.id!, payload)

      if (result.error) throw new Error(result.error)

      router.push(mode === 'create' ? '/internal/deals' : `/internal/deals/${initialData!.id}`)
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
          <CardTitle className="text-zo-chrome">{mode === 'create' ? 'New Deal' : 'Edit Deal'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Deal Name</Label>
              <Input value={form.name} onChange={set('name')} required placeholder="Company - opportunity" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lead</Label>
                <select value={form.lead_id} onChange={set('lead_id')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">No linked lead</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.company || lead.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Stage</Label>
                <select value={stage} onChange={event => setStage(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {DEAL_STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Estimated Value</Label>
                <Input type="number" value={form.estimated_value} onChange={set('estimated_value')} placeholder="5000" />
              </div>
              <div className="space-y-2">
                <Label>Expected Close</Label>
                <Input type="date" value={form.expected_close_date} onChange={set('expected_close_date')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Next Step</Label>
              <Input value={form.next_step} onChange={set('next_step')} placeholder="Schedule discovery, send proposal..." />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={set('notes')} rows={3} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : mode === 'create' ? 'Create Deal' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
