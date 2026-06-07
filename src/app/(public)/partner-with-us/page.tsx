'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function PartnerWithUsPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', type: '', pitch: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('partners').insert({ ...form, status: 'new_application' })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Card className="bg-card border-border text-center p-8">
        <CardContent>
          <p className="text-zo-amber text-lg font-medium">Application Received</p>
          <p className="text-sm text-muted-foreground mt-2">We&apos;ll review your partnership interest and respond within 48 hours.</p>
        </CardContent>
      </Card>
    )
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-zo-chrome">Partner With ZeroOrigins</CardTitle>
        <CardDescription>Institutes, freelancers, agencies, consultants — let&apos;s grow together.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Your Name *</Label><Input value={form.name} onChange={set('name')} required /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={set('email')} required /></div>
            <div className="space-y-2"><Label>Company / Organization</Label><Input value={form.company} onChange={set('company')} /></div>
            <div className="space-y-2">
              <Label>Partnership Type</Label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="">Select type...</option>
                <option value="training_institute">Training Institute</option>
                <option value="marketing_freelancer">Marketing Freelancer</option>
                <option value="referral_consultant">Referral Consultant</option>
                <option value="agency">Agency</option>
                <option value="reseller">Reseller</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="space-y-2"><Label>How would you like to partner? *</Label><Textarea value={form.pitch} onChange={set('pitch')} rows={4} required placeholder="Describe the partnership you have in mind..." /></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Submitting...' : 'Submit Application'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
