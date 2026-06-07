'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isValidEmail, minLength } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type FormErrors = Record<string, string>

export default function RequestBuildPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', service_interest: '', budget_range: '', notes: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const supabase = createClient()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors(prev => { const next = { ...prev }; delete next[k]; return next })
  }

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) {
      errs.email = 'Email is required'
    } else if (!isValidEmail(form.email)) {
      errs.email = 'Enter a valid email address'
    }
    if (!form.service_interest.trim()) errs.service_interest = 'Please describe what you need'
    if (form.notes.trim() && !minLength(form.notes, 20)) {
      errs.notes = 'Please describe your project in at least 20 characters'
    }
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    setServerError('')
    try {
      const { error } = await supabase.from('leads').insert({ ...form, source: 'request_build_form', status: 'new' })
      if (error) throw error
      setSubmitted(true)
    } catch {
      setServerError('Something went wrong. Please try again or email us directly.')
      setLoading(false)
    }
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

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-zo-chrome">Request a Build</CardTitle>
        <CardDescription>Tell us what you need built. AI automation, apps, systems — we&apos;ll scope it.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Your Name *</Label>
              <Input value={form.name} onChange={set('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={set('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
            <div className="space-y-1">
              <Label>Company / Brand</Label>
              <Input value={form.company} onChange={set('company')} />
            </div>
            <div className="space-y-1">
              <Label>Budget Range</Label>
              <Input value={form.budget_range} onChange={set('budget_range')} placeholder="$200–500, $1000+, etc." />
            </div>
          </div>
          <div className="space-y-1">
            <Label>What do you need? *</Label>
            <Input value={form.service_interest} onChange={set('service_interest')} placeholder="AI automation, website, app, lead system..." />
            {errors.service_interest && <p className="text-xs text-red-500">{errors.service_interest}</p>}
          </div>
          <div className="space-y-1">
            <Label>Additional Details</Label>
            <Textarea value={form.notes} onChange={set('notes')} rows={4} placeholder="Tell us more about your project..." />
            {errors.notes && <p className="text-xs text-red-500">{errors.notes}</p>}
          </div>
          {serverError && <p className="text-sm text-red-500">{serverError}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
