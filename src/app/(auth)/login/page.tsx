'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Loader2, ArrowRight } from 'lucide-react'
import { INTERNAL_ROLES, EXTERNAL_ROLES, type Role } from '@/types'
import { isZeroOriginsEmail } from '@/lib/supabase/auth-helpers'
import { ensureProfile } from '@/lib/actions/auth'
import Image from 'next/image'

const INTENT_PANELS = {
  internal: {
    badge: 'Internal Access',
    dot: 'bg-violet-500',
    text: 'text-violet-300',
    heading: ['Your AI', 'Studio OS'],
    desc: 'The operating room for ZeroOrigins. Ideas, revenue, agents — unified.',
    bullets: ['Ideas vault → product pipeline', 'ZO_Agent briefing every morning', 'Leads, proposals, and revenue'],
    glow: 'radial-gradient(ellipse 80% 65% at 15% 55%, rgba(139,92,246,0.22) 0%, transparent 65%)',
  },
  customer: {
    badge: 'Client Portal',
    dot: 'bg-blue-400',
    text: 'text-blue-300',
    heading: ['Your Project', 'Dashboard'],
    desc: 'Track your build, proposals, and deliverables in real time.',
    bullets: ['Live project tracking', 'Proposal & invoice history', 'Direct team communication'],
    glow: 'radial-gradient(ellipse 80% 65% at 15% 55%, rgba(59,130,246,0.18) 0%, transparent 65%)',
  },
  partner: {
    badge: 'Partner Hub',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
    heading: ['Partner', 'Network'],
    desc: 'Co-build, refer, and grow with ZeroOrigins.',
    bullets: ['Co-sell opportunities', 'Referral tracking', 'Partner-exclusive resources'],
    glow: 'radial-gradient(ellipse 80% 65% at 15% 55%, rgba(16,185,129,0.18) 0%, transparent 65%)',
  },
}

const DEFAULT_PANEL = {
  badge: 'ZeroOrigins OS',
  dot: 'bg-violet-500',
  text: 'text-violet-300',
  heading: ['Built for', 'AI Studios'],
  desc: 'The operating system for teams building the future with AI.',
  bullets: ['Internal CRM & project management', 'Client and partner portals', 'AI-native from day one'],
  glow: 'radial-gradient(ellipse 80% 65% at 15% 55%, rgba(139,92,246,0.20) 0%, transparent 65%)',
}

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

  const intentLabels: Record<string, { title: string; subtitle: string; note?: string }> = {
    internal: {
      title: 'Internal Login',
      subtitle: 'Sign in to your ZeroOrigins workspace.',
      note: 'Internal access is limited to active @zeroorigins.in accounts.',
    },
    customer: {
      title: 'Customer Login',
      subtitle: 'Access your client portal and project dashboard.',
    },
    partner: {
      title: 'Partner Login',
      subtitle: 'Access collaboration tools and partner resources.',
    },
  }

  const currentIntent = intent
    ? intentLabels[intent] || { title: 'Sign In', subtitle: 'Access your account.' }
    : { title: 'Sign In', subtitle: 'Access your account.' }

  const panel = (intent && INTENT_PANELS[intent as keyof typeof INTENT_PANELS]) || DEFAULT_PANEL

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (intent === 'internal' && !isZeroOriginsEmail(email)) {
      setError('Use your ZeroOrigins internal email.')
      setLoading(false)
      return
    }

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.signInWithPassword({ email, password })

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

      let role: Role | undefined
      let profileStatus: string | undefined
      const { data: prof, error: selectError } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .maybeSingle()

      if (selectError) {
        setError(`Could not read your profile: ${selectError.message}. Please contact support.`)
        setLoading(false)
        return
      }

      if (prof?.role) {
        role = prof.role as Role
        profileStatus = prof.status ?? 'active'
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
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex flex-col relative overflow-hidden w-[420px] flex-shrink-0 bg-[#080808] border-r border-white/[0.05]">
        <div className="absolute inset-0 pointer-events-none" style={{ background: panel.glow }} />
        <div className="absolute inset-0 zo-grid-pattern opacity-[0.07] pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Wordmark */}
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="ZeroOrigins" width={28} height={28} className="w-7 h-7" priority />
            <span className="text-sm font-medium text-white/60 tracking-tight">ZeroOrigins</span>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-8">
              <div className={`w-1.5 h-1.5 rounded-full ${panel.dot} animate-pulse`} />
              <span className={`text-[10px] font-mono uppercase tracking-[0.18em] ${panel.text}`}>
                {panel.badge}
              </span>
            </div>

            <h2 className="text-[2.6rem] font-bold text-white leading-[1.07] tracking-tight mb-5">
              {panel.heading.map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h2>

            <p className="text-sm text-white/38 leading-relaxed mb-10 max-w-[220px]">
              {panel.desc}
            </p>

            <ul className="space-y-3.5">
              {panel.bullets.map((b, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-white/42">
                  <div className="w-1 h-1 rounded-full bg-white/25 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <p className="font-mono text-[9px] text-white/15 uppercase tracking-[0.2em]">
            Secured · ZeroOrigins Auth
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-[340px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 flex items-center gap-2.5">
            <Image src="/logo.png" alt="ZeroOrigins" width={32} height={32} className="w-8 h-8" priority />
            <span className="text-sm font-medium text-white/60">ZeroOrigins</span>
          </div>

          <div className="mb-8">
            <h1 className="text-[1.6rem] font-bold text-white mb-1.5 tracking-tight">
              {currentIntent.title}
            </h1>
            <p className="text-sm text-white/42">{currentIntent.subtitle}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/[0.07] border border-red-500/20 text-xs text-red-300 leading-relaxed">
                {error}
              </div>
            )}

            <fieldset disabled={loading} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] text-white/32 uppercase tracking-[0.14em] font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={intent === 'internal' ? 'name@zeroorigins.in' : 'you@example.com'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/18 focus:border-zo-purple/50 focus:bg-white/[0.06] transition-colors rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] text-white/32 uppercase tracking-[0.14em] font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/18 focus:border-zo-purple/50 focus:bg-white/[0.06] transition-colors rounded-lg"
                />
              </div>
            </fieldset>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-zo-purple hover:bg-[#7c3aed] text-white font-medium rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  {redirecting ? 'Opening workspace…' : 'Signing in…'}
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <Link
              href={`/signup${intent ? `?intent=${intent}` : ''}`}
              className="text-xs text-white/38 hover:text-white/65 transition-colors"
            >
              Create account
            </Link>
            <Link
              href="/forgot-password"
              className="text-xs text-white/38 hover:text-white/65 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {currentIntent.note && (
            <p className="mt-5 text-[11px] text-white/22 text-center leading-relaxed">
              {currentIntent.note}
            </p>
          )}

          <div className="mt-10 text-center">
            <Link
              href="/"
              className="text-[10px] text-white/18 hover:text-white/45 uppercase tracking-[0.15em] transition-colors"
            >
              ← Gateway
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
          <div className="w-5 h-5 border-2 border-zo-purple/50 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
