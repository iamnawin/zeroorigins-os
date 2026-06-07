'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LEAD_STATUSES, type Lead } from '@/types'

interface Props {
  mode: 'create' | 'edit'
  initialData?: Partial<Lead>
}

export default function LeadForm({ mode, initialData }: Props) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    email: initialData?.email ?? '',
    company: initialData?.company ?? '',
    source: initialData?.source ?? '',
    service_interest: initialData?.service_interest ?? '',
    budget_range: initialData?.budget_range ?? '',
    notes: initialData?.notes ?? '',
  })
  const [status, setStatus] = useState<string>(initialData?.status ?? 'new')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'create') {
        const { data: { user } } = await supabase.auth.getUser()
        const { error: err } = await supabase.from('leads').insert({
          ...form, status: 'new', owner_id: user?.id, created_by: user?.id,
        })
        if (err) throw err
        router.push('/internal/leads')
      } else {
        const { error: err } = await supabase.from('leads')
          .update({ ...form, status })
          .eq('id', initialData!.id!)
        if (err) throw err
        router.push(`/internal/leads/${initialData!.id}`)
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
          <CardTitle className="text-zo-chrome">{mode === 'create' ? 'New Lead' : 'Edit Lead'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={set('name')} required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={set('email')} required /></div>
              <div className="space-y-2"><Label>Company</Label><Input value={form.company} onChange={set('company')} /></div>
              <div className="space-y-2"><Label>Source</Label><Input value={form.source} onChange={set('source')} placeholder="website, referral, linkedin..." /></div>
              <div className="space-y-2"><Label>Service Interest</Label><Input value={form.service_interest} onChange={set('service_interest')} /></div>
              <div className="space-y-2"><Label>Budget Range</Label><Input value={form.budget_range} onChange={set('budget_range')} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={set('notes')} rows={3} /></div>
            {mode === 'edit' && (
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {LEAD_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : mode === 'create' ? 'Create Lead' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
