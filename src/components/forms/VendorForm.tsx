'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FINANCE_CATEGORIES, type Vendor } from '@/types'
import { createVendor, updateVendor } from '@/lib/actions/internal-resources'

interface Props {
  mode: 'create' | 'edit'
  initialData?: Partial<Vendor>
}

export default function VendorForm({ mode, initialData }: Props) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    website: initialData?.website ?? '',
    contact_email: initialData?.contact_email ?? '',
    category: initialData?.category ?? 'software',
    notes: initialData?.notes ?? '',
  })
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
      const result = mode === 'create'
        ? await createVendor(form)
        : await updateVendor(initialData!.id!, form)

      if (result.error) throw new Error(result.error)

      router.push('/internal/finance')
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
          <CardTitle className="text-zo-chrome">{mode === 'create' ? 'New Vendor' : 'Edit Vendor'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={set('name')} required placeholder="Vercel, Supabase, Together AI..." />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={form.website} onChange={set('website')} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input type="email" value={form.contact_email} onChange={set('contact_email')} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Category</Label>
                <select value={form.category} onChange={set('category')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {FINANCE_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={set('notes')} rows={3} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : mode === 'create' ? 'Create Vendor' : 'Save Changes'}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
