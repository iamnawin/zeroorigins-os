'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PARTNER_STATUSES, type Partner } from '@/types'
import { createPartner, updatePartner } from '@/lib/actions/internal-resources'

interface Props {
  mode: 'create' | 'edit'
  initialData?: Partial<Partner>
}

export default function PartnerForm({ mode, initialData }: Props) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    email: initialData?.email ?? '',
    company: initialData?.company ?? '',
    type: initialData?.type ?? '',
    pitch: initialData?.pitch ?? '',
    notes: initialData?.notes ?? '',
  })
  const [status, setStatus] = useState<string>(initialData?.status ?? 'new_application')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = mode === 'create'
        ? await createPartner(form)
        : await updatePartner(initialData!.id!, { ...form, status: status as Partner['status'] })

      if (result.error) throw new Error(result.error)

      if (mode === 'create') {
        router.push('/internal/partners')
      } else {
        router.push(`/internal/partners/${initialData!.id}`)
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
          <CardTitle className="text-zo-chrome">{mode === 'create' ? 'Add Partner' : 'Edit Partner'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={set('name')} required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={set('email')} required /></div>
              <div className="space-y-2"><Label>Company</Label><Input value={form.company} onChange={set('company')} /></div>
              <div className="space-y-2"><Label>Type</Label><Input value={form.type} onChange={set('type')} placeholder="training_institute, freelancer..." /></div>
            </div>
            <div className="space-y-2"><Label>Pitch / Notes</Label><Textarea value={form.pitch} onChange={set('pitch')} rows={3} /></div>
            {mode === 'edit' && (
              <>
                <div className="space-y-2"><Label>Internal Notes</Label><Textarea value={form.notes} onChange={set('notes')} rows={2} /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                    {PARTNER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : mode === 'create' ? 'Add Partner' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
