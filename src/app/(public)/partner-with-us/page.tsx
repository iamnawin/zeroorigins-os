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

export default function PartnerWithUsPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', type: '', pitch: '' })
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
    if (!form.type) errs.type = 'Please select a partnership type'
    if (!form.pitch.trim()) {
      errs.pitch = 'Please describe the partnership'
    } else if (!minLength(form.pitch, 20)) {
      errs.pitch = 'Please describe the partnership in at least 20 characters'
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
      const { error } = await supabase.from('partners').insert({ ...form, status: 'new_application' })
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
          <p className="text-zo-amber text-lg font-medium">Application Received</p>
          <p className="text-sm text-muted-foreground mt-2">We&apos;ll review your partnership interest and respond within 48 hours.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-zo-chrome">Partner With ZeroOrigins</CardTitle>
        <CardDescription>Institutes, freelancers, agencies, consultants — let&apos;s grow together.</CardDescription>
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
              <Label>Company / Organization</Label>
              <Input value={form.company} onChange={set('company')} />
            </div>
            <div className="space-y-1">
              <Label>Partnership Type *</Label>
              <select
                value={form.type}
                onChange={e => { setForm(f => ({ ...f, type: e.target.value })); if (errors.type) setErrors(prev => { const next = { ...prev }; delete next.type; return next }) }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select type...</option>
                <option value="training_institute">Training Institute</option>
                <option value="marketing_freelancer">Marketing Freelancer</option>
                <option value="referral_consultant">Referral Consultant</option>
                <option value="agency">Agency</option>
                <option value="reseller">Reseller</option>
                <option value="other">Other</option>
              </select>
              {errors.type && <p className="text-xs text-red-500">{errors.type}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label>How would you like to partner? *</Label>
            <Textarea value={form.pitch} onChange={set('pitch')} rows={4} placeholder="Describe the partnership you have in mind..." />
            {errors.pitch && <p className="text-xs text-red-500">{errors.pitch}</p>}
          </div>
          {serverError && <p className="text-sm text-red-500">{serverError}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Submitting...' : 'Submit Application'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
