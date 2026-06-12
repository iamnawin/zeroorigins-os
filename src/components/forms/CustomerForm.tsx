'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CUSTOMER_STATUSES, type Customer } from '@/types'
import { createCustomer, updateCustomer } from '@/lib/actions/internal-resources'

interface Props {
  mode: 'create' | 'edit'
  initialData?: Partial<Customer>
}

export default function CustomerForm({ mode, initialData }: Props) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    email: initialData?.email ?? '',
    company: initialData?.company ?? '',
    phone: initialData?.phone ?? '',
    website: initialData?.website ?? '',
    notes: initialData?.notes ?? '',
  })
  const [status, setStatus] = useState<string>(initialData?.status ?? 'active')
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
        ? await createCustomer(form)
        : await updateCustomer(initialData!.id!, { ...form, status: status as Customer['status'] })

      if (result.error) throw new Error(result.error)

      router.push(mode === 'create' ? '/internal/customers' : `/internal/customers/${initialData!.id}`)
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
          <CardTitle className="text-zo-chrome">{mode === 'create' ? 'New Customer' : 'Edit Customer'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={set('name')} required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={set('email')} required /></div>
              <div className="space-y-2"><Label>Company</Label><Input value={form.company} onChange={set('company')} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={set('phone')} /></div>
              <div className="space-y-2 col-span-2"><Label>Website</Label><Input value={form.website} onChange={set('website')} placeholder="https://..." /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={set('notes')} rows={3} /></div>
            {mode === 'edit' && (
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {CUSTOMER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : mode === 'create' ? 'Create Customer' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
