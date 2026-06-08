'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { INTERNAL_ROLES, type Role } from '@/types'
import { isZeroOriginsEmail } from '@/lib/supabase/auth-helpers'
import { ensureProfile } from '@/lib/actions/auth'

function LoginForm() {
  const searchParams = useSearchParams()
  const intent = searchParams.get('intent')
  const initialError = searchParams.get('error')
  
  const errorMessages: Record<string, string> = {
    invalid_domain: 'Internal workspace requires a @zeroorigins.in email address.',
    auth_callback_failed: 'Authentication handshake failed. Please try signing in again or contact support.',
  }
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(initialError ? errorMessages[initialError] || '' : '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const intentLabels: Record<string, string> = {
    internal: 'Internal Login',
    customer: 'Customer Login',
    partner: 'Partner Login'
  }

  const currentLabel = intent ? intentLabels[intent] || 'Sign In' : 'Sign In'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Domain Validation for Internal Intent
    if (intent === 'internal' && !isZeroOriginsEmail(email)) {
      setError('Internal workspace requires a @zeroorigins.in email address.')
      setLoading(false)
      return
    }
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!user) {
        setError('Login failed. Please try again.')
        setLoading(false)
        return
      }

      // Read the profile with the BROWSER client — it has the fresh session,
      // so this avoids the server-action session-propagation race.
      let role: Role | undefined
      const { data: prof, error: selectError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (selectError) {
        // The profile READ itself failed (e.g. an RLS/policy misconfiguration).
        // Surface the real error instead of falling through to a self-heal
        // insert, whose RLS rejection would otherwise mask the true cause.
        setError(`Could not read your profile: ${selectError.message}. Please contact support.`)
        setLoading(false)
        return
      }

      if (prof?.role) {
        role = prof.role as Role
      } else {
        // Self-heal: create a default profile. @zeroorigins.in → employee, else → CUSTOMER.
        const defaultRole = user.email?.endsWith('@zeroorigins.in') ? 'employee' : 'CUSTOMER'
        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          role: defaultRole,
        })
        if (!insertError) {
          role = defaultRole as Role
        } else {
          // Last resort: server-side self-heal (service role, if configured).
          const res = await ensureProfile()
          if (res.success && res.role) {
            role = res.role as Role
          } else {
            setError(`Could not load your profile: ${insertError.message}. Please contact support.`)
            setLoading(false)
            return
          }
        }
      }

      let redirectPath = '/portal/customer/dashboard'
      if (role && INTERNAL_ROLES.includes(role)) {
        redirectPath = '/internal/control-room'
      } else if (role === 'PARTNER' || role === 'REFERRAL_PARTNER') {
        redirectPath = '/portal/partner/dashboard'
      } else if (intent === 'internal') {
        redirectPath = '/portal/customer/dashboard?message=unauthorized_internal'
      }

      router.push(redirectPath)
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold text-zo-chrome">{currentLabel}</h1>
        <p className="text-sm text-zo-muted">Sign in to your ZeroOrigins workspace</p>
      </div>

      <Card className="border-border bg-card shadow-2xl">
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive font-medium leading-relaxed">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zo-muted text-xs uppercase tracking-widest font-bold">Email</Label>
              <Input id="email" type="email" placeholder="name@zeroorigins.in" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zo-muted text-xs uppercase tracking-widest font-bold">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full font-bold h-11" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
            <div className="flex gap-6 text-xs text-zo-muted mt-2">
              <Link href={`/signup${intent ? `?intent=${intent}` : ''}`} className="hover:text-zo-purple transition-colors">Create account</Link>
              <Link href="/forgot-password" title="Forgot password?" className="hover:text-zo-purple transition-colors">Forgot password?</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
      
      <div className="text-center">
        <Link href="/" className="text-[10px] uppercase tracking-widest text-zo-muted hover:text-zo-purple transition-colors">
          ← Back to Gateway
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <div className="w-6 h-6 border-2 border-zo-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
