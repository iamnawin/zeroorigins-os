'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PROPOSAL_STATUSES, type Proposal } from '@/types'
import { createProposal, updateProposal } from '@/lib/actions/internal-resources'

interface Props {
  mode: 'create' | 'edit'
  initialData?: Partial<Proposal>
  prefillLeadId?: string
  prefillDealId?: string
  prefillServiceType?: string
  prefillNotes?: string
}

export default function ProposalForm({ mode, initialData, prefillLeadId, prefillDealId, prefillServiceType, prefillNotes }: Props) {
  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    lead_id: initialData?.lead_id ?? prefillLeadId ?? '',
    deal_id: initialData?.deal_id ?? prefillDealId ?? '',
    service_type: initialData?.service_type ?? prefillServiceType ?? '',
    scope: initialData?.scope ?? '',
    amount: initialData?.amount?.toString() ?? '',
    timeline: initialData?.timeline ?? '',
    proposal_url: initialData?.proposal_url ?? '',
    internal_notes: initialData?.internal_notes ?? prefillNotes ?? '',
    customer_visible_notes: initialData?.customer_visible_notes ?? '',
    expires_at: initialData?.expires_at ? initialData.expires_at.slice(0, 10) : '',
  })
  const [status, setStatus] = useState<string>(initialData?.status ?? 'draft')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const payload = {
      ...form,
      amount: form.amount || null,
      lead_id: form.lead_id || null,
      expires_at: form.expires_at || null,
      status: status as Proposal['status'],
    }
    try {
      const result = mode === 'create'
        ? await createProposal(payload)
        : await updateProposal(initialData!.id!, payload)

      if (result.error) throw new Error(result.error)

      router.push(mode === 'create' ? '/internal/proposals' : `/internal/proposals/${initialData!.id}`)
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
          <CardTitle className="text-zo-chrome">{mode === 'create' ? 'New Proposal' : 'Edit Proposal'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={set('title')} required placeholder="Proposal title..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Input value={form.service_type} onChange={set('service_type')} placeholder="AI automation, website..." />
              </div>
              <div className="space-y-2">
                <Label>Price / Amount</Label>
                <Input type="number" value={form.amount} onChange={set('amount')} placeholder="5000" />
              </div>
              <div className="space-y-2">
                <Label>Timeline</Label>
                <Input value={form.timeline} onChange={set('timeline')} placeholder="4 weeks, 2 months..." />
              </div>
              <div className="space-y-2">
                <Label>Expires</Label>
                <Input type="date" value={form.expires_at} onChange={set('expires_at')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Scope</Label>
              <Textarea value={form.scope} onChange={set('scope')} rows={3} placeholder="What is included in this proposal..." />
            </div>
            <div className="space-y-2">
              <Label>Proposal URL</Label>
              <Input value={form.proposal_url} onChange={set('proposal_url')} placeholder="https://docs.google.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Internal Notes</Label>
              <Textarea value={form.internal_notes} onChange={set('internal_notes')} rows={2} placeholder="Internal context, lead background..." />
            </div>
            <div className="space-y-2">
              <Label>Customer-Visible Notes</Label>
              <Textarea value={form.customer_visible_notes} onChange={set('customer_visible_notes')} rows={2} placeholder="Notes visible to the customer..." />
            </div>
            {(mode === 'edit' || form.lead_id) && (
              <div className="space-y-2">
                <Label>Lead ID</Label>
                <Input value={form.lead_id} onChange={set('lead_id')} placeholder="Lead UUID (optional)" />
              </div>
            )}
            {(mode === 'edit' || form.deal_id) && (
              <div className="space-y-2">
                <Label>Deal ID</Label>
                <Input value={form.deal_id} onChange={set('deal_id')} placeholder="Deal UUID (optional)" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {PROPOSAL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : mode === 'create' ? 'Create Proposal' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
