'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isValidEmail, isValidPhoneLike, isValidUrl, minLength } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type FormErrors = Record<string, string>

export default function RequestBuildPage() {
  const [form, setForm] = useState({
    name: '', email: '', company: '', service_interest: '', budget_range: '', notes: '',
    phone: '', whatsapp: '', website: '', preferred_contact_method: '', preferred_call_time: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const supabase = createClient()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    if (form.phone.trim() && !isValidPhoneLike(form.phone)) errs.phone = 'Enter a valid phone number'
    if (form.whatsapp.trim() && !isValidPhoneLike(form.whatsapp)) errs.whatsapp = 'Enter a valid WhatsApp number'
    if (form.website.trim() && !isValidUrl(form.website)) errs.website = 'Enter a valid URL (include https://)'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    setServerError('')
    try {
      const { error } = await supabase.from('leads').insert({
        ...form,
        source: 'request_build_form',
        status: 'new',
        automation_status: 'not_started',
        automation_source: 'zeroorigins_os_public_form',
      })
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
          <p className="text-zo-purple text-lg font-medium">Request Received</p>
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
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>
            <div className="space-y-1">
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={set('whatsapp')} placeholder="+91 98765 43210" />
              {errors.whatsapp && <p className="text-xs text-red-500">{errors.whatsapp}</p>}
            </div>
            <div className="space-y-1">
              <Label>Website / Portfolio</Label>
              <Input value={form.website} onChange={set('website')} placeholder="https://yoursite.com" />
              {errors.website && <p className="text-xs text-red-500">{errors.website}</p>}
            </div>
            <div className="space-y-1">
              <Label>Preferred Contact</Label>
              <select
                value={form.preferred_contact_method}
                onChange={set('preferred_contact_method')}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">No preference</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>What do you need? *</Label>
            <Input value={form.service_interest} onChange={set('service_interest')} placeholder="AI automation, website, app, lead system..." />
            {errors.service_interest && <p className="text-xs text-red-500">{errors.service_interest}</p>}
          </div>
          <div className="space-y-1">
            <Label>Best time to call / reach you</Label>
            <Input value={form.preferred_call_time} onChange={set('preferred_call_time')} placeholder="Weekdays 10am–1pm IST, etc." />
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
