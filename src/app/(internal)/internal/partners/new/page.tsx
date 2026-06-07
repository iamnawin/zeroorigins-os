'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewPartnerPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', type: '', pitch: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('partners').insert({ ...form, status: 'new_application', owner_id: user?.id, created_by: user?.id })
    router.push('/internal/partners')
    router.refresh()
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="max-w-2xl">
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-zo-chrome">Add Partner</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={set('name')} required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={set('email')} required /></div>
              <div className="space-y-2"><Label>Company</Label><Input value={form.company} onChange={set('company')} /></div>
              <div className="space-y-2"><Label>Type</Label><Input value={form.type} onChange={set('type')} placeholder="training_institute, freelancer..." /></div>
            </div>
            <div className="space-y-2"><Label>Pitch / Notes</Label><Textarea value={form.pitch} onChange={set('pitch')} rows={3} /></div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Add Partner'}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
