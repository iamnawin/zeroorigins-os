'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function RequestBuildPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', service_interest: '', budget_range: '', notes: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('leads').insert({ ...form, source: 'request_build_form', status: 'new' })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Card className="bg-card border-border text-center p-8">
        <CardContent>
          <p className="text-zo-amber text-lg font-medium">Request Received</p>
          <p className="text-sm text-muted-foreground mt-2">We&apos;ll review your request and get back to you within 24 hours.</p>
        </CardContent>
      </Card>
    )
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-zo-chrome">Request a Build</CardTitle>
        <CardDescription>Tell us what you need built. AI automation, apps, systems — we&apos;ll scope it.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Your Name *</Label><Input value={form.name} onChange={set('name')} required /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={set('email')} required /></div>
            <div className="space-y-2"><Label>Company / Brand</Label><Input value={form.company} onChange={set('company')} /></div>
            <div className="space-y-2"><Label>Budget Range</Label><Input value={form.budget_range} onChange={set('budget_range')} placeholder="$200-500, $1000+, etc." /></div>
          </div>
          <div className="space-y-2"><Label>What do you need? *</Label><Input value={form.service_interest} onChange={set('service_interest')} required placeholder="AI automation, website, app, lead system..." /></div>
          <div className="space-y-2"><Label>Additional Details</Label><Textarea value={form.notes} onChange={set('notes')} rows={4} placeholder="Tell us more about your project..." /></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
