'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { INTERNAL_ROLES, EXTERNAL_ROLES, type Role } from '@/types'
import { isZeroOriginsEmail } from '@/lib/supabase/auth-helpers'
import { ensureProfile } from '@/lib/actions/auth'
import Image from 'next/image'

function LoginForm() {
  const searchParams = useSearchParams()
  const intent = searchParams.get('intent')
  const initialError = searchParams.get('error')
  
  const errorMessages: Record<string, string> = {
    invalid_domain: 'Use your ZeroOrigins internal email.',
    auth_callback_failed: 'Authentication handshake failed. Please try signing in again or contact support.',
    invalid_role: 'Invalid internal role configuration.',
    pending_approval: 'Your account is pending admin approval.',
  }
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(initialError ? errorMessages[initialError] || '' : '')
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const intentLabels: Record<string, { title: string, subtitle: string, note?: string }> = {
    internal: { 
      title: 'Internal Login', 
      subtitle: 'Sign in to your ZeroOrigins workspace.',
      note: 'Internal access is limited to active @zeroorigins.in accounts.'
    },
    customer: { 
      title: 'Customer Login', 
      subtitle: 'Access your client portal and project dashboard.',
    },
    partner: { 
      title: 'Partner Login', 
      subtitle: 'Access collaboration tools and partner resources.',
    }
  }

  const currentIntent = intent ? intentLabels[intent] || { title: 'Sign In', subtitle: 'Access your account.' } : { title: 'Sign In', subtitle: 'Access your account.' }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Domain Validation for Internal Intent
    if (intent === 'internal' && !isZeroOriginsEmail(email)) {
      setError('Use your ZeroOrigins internal email.')
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
      let profileStatus: string | undefined
      const { data: prof, error: selectError } = await supabase
        .from('profiles')
        .select('role, status')
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
        profileStatus = prof.status ?? 'active'
        // Legacy/unknown roles (pre-simplification FOUNDER/SUPER_ADMIN etc.)
        // must be fixed in the database — never route them into the portals.
        if (!([...INTERNAL_ROLES, ...EXTERNAL_ROLES] as Role[]).includes(role)) {
          await supabase.auth.signOut()
          setError('Invalid internal role configuration.')
          setLoading(false)
          return
        }
        if (profileStatus === 'pending') {
          await supabase.auth.signOut()
          setError('Your account is pending admin approval.')
          setLoading(false)
          return
        }
        if (profileStatus === 'disabled') {
          await supabase.auth.signOut()
          setError('Your account has been disabled. Contact admin.')
          setLoading(false)
          return
        }
      } else {
        // Self-heal: create a default profile. @zeroorigins.in → employee, else → CUSTOMER.
        const defaultRole = user.email?.toLowerCase().endsWith('@zeroorigins.in') ? 'employee' : 'CUSTOMER'
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
            setError('Account exists but internal profile is not active. Contact admin.')
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

      setRedirecting(true)
      router.push(redirectPath)
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="ZeroOrigins"
            width={48}
            height={48}
            className="w-12 h-12"
            priority
          />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">{currentIntent.title}</h1>
          <p className="text-white/60">{currentIntent.subtitle}</p>
          {currentIntent.note && (
            <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed">
              {currentIntent.note}
            </p>
          )}
        </div>
      </div>

      {/* Auth Card */}
      <Card className="zo-glass-elevated border-white/10 backdrop-blur-xl">
        <form onSubmit={handleLogin}>
          <CardContent className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300 leading-relaxed">
                {error}
              </div>
            )}
            <fieldset disabled={loading} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-white/80 font-medium">
                  Email Address
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder={intent === 'internal' ? 'name@zeroorigins.in' : 'your@email.com'}
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-white/80 font-medium">
                  Password
                </Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter your password"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring"
                />
              </div>
            </fieldset>
          </CardContent>
          <CardFooter className="p-8 pt-0 flex-col gap-6">
            <Button 
              type="submit" 
              className="w-full h-12 zo-button-primary text-white font-semibold" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {redirecting ? 'Opening workspace...' : loading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            <div className="flex justify-center gap-8 text-sm text-white/60">
              <Link 
                href={`/signup${intent ? `?intent=${intent}` : ''}`} 
                className="hover:text-white zo-motion-safe"
              >
                Create account
              </Link>
              <Link 
                href="/forgot-password" 
                className="hover:text-white zo-motion-safe"
              >
                Forgot password?
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
      
      {/* Footer */}
      <div className="text-center">
        <Link 
          href="/" 
          className="text-xs text-white/40 hover:text-white/60 zo-motion-safe uppercase tracking-wide"
        >
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
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
