'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { INTERNAL_ROLES } from '@/types'
import { isZeroOriginsEmail } from '@/lib/supabase/auth-helpers'

const INTENT_PANELS = {
  internal: {
    badge: 'Internal Access',
    dot: 'bg-violet-500',
    text: 'text-violet-300',
    heading: ['Join Your', 'Studio OS'],
    desc: 'Create your ZeroOrigins workspace account and enter the operating room.',
    bullets: ['Ideas vault → product pipeline', 'ZO_Agent at your side', 'Every metric in one place'],
    glow: 'radial-gradient(ellipse 80% 65% at 15% 55%, rgba(139,92,246,0.22) 0%, transparent 65%)',
  },
  customer: {
    badge: 'Client Portal',
    dot: 'bg-blue-400',
    text: 'text-blue-300',
    heading: ['Start Your', 'Project Portal'],
    desc: 'Create an account to track your build, proposals, and deliverables.',
    bullets: ['Live project tracking', 'Proposal & invoice history', 'Direct team communication'],
    glow: 'radial-gradient(ellipse 80% 65% at 15% 55%, rgba(59,130,246,0.18) 0%, transparent 65%)',
  },
  partner: {
    badge: 'Partner Hub',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
    heading: ['Join the', 'Network'],
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

function SignupForm() {
  const searchParams = useSearchParams()
  const intent = searchParams.get('intent')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const intentLabels: Record<string, { title: string; subtitle: string; note?: string }> = {
    internal: {
      title: 'Internal Signup',
      subtitle: 'Create your ZeroOrigins workspace account.',
      note: 'Internal accounts require @zeroorigins.in email addresses.',
    },
    customer: {
      title: 'Customer Signup',
      subtitle: 'Create your client portal account.',
    },
    partner: {
      title: 'Partner Signup',
      subtitle: 'Join the ZeroOrigins partner network.',
    },
  }

  const currentIntent = intent
    ? intentLabels[intent] || { title: 'Create Account', subtitle: 'Join ZeroOrigins today.' }
    : { title: 'Create Account', subtitle: 'Join ZeroOrigins today.' }

  const panel = (intent && INTENT_PANELS[intent as keyof typeof INTENT_PANELS]) || DEFAULT_PANEL

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (intent === 'internal' && !isZeroOriginsEmail(email)) {
      setError('Internal accounts require a @zeroorigins.in email address.')
      setLoading(false)
      return
    }

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!user) {
        setError('Signup failed. Please try again.')
        setLoading(false)
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setSuccess(true)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role || 'CUSTOMER'

      let redirectPath = '/portal/customer/dashboard'
      if (INTERNAL_ROLES.includes(role)) {
        redirectPath = '/internal/control-room'
      } else if (role === 'PARTNER' || role === 'REFERRAL_PARTNER') {
        redirectPath = '/portal/partner/dashboard'
      }

      router.push(redirectPath)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const BrandPanel = (
    <div className="hidden lg:flex flex-col relative overflow-hidden w-[420px] flex-shrink-0 bg-[#080808] border-r border-white/[0.05]">
      <div className="absolute inset-0 pointer-events-none" style={{ background: panel.glow }} />
      <div className="absolute inset-0 zo-grid-pattern opacity-[0.07] pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full p-10">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="ZeroOrigins" width={28} height={28} className="w-7 h-7" priority />
          <span className="text-sm font-medium text-white/60 tracking-tight">ZeroOrigins</span>
        </div>

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
  )

  if (success) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a]">
        {BrandPanel}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-[340px] text-center">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 rounded-full bg-zo-purple/10 border border-zo-purple/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-zo-purple-2" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Check your email</h1>
            <p className="text-sm text-white/42 mb-1">Verification link sent to</p>
            <p className="text-sm text-zo-purple-2 font-medium mb-8">{email}</p>

            <div className="px-5 py-4 rounded-lg bg-white/[0.03] border border-white/[0.07] mb-8">
              <p className="text-xs text-white/45 leading-relaxed">
                Click the link in your inbox to activate your ZeroOrigins account.
              </p>
            </div>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 h-11 w-full rounded-lg bg-zo-purple hover:bg-[#7c3aed] text-white text-sm font-medium transition-colors"
            >
              Back to Login <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {BrandPanel}

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

          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/[0.07] border border-red-500/20 text-xs text-red-300 leading-relaxed">
                {error}
              </div>
            )}

            <fieldset disabled={loading} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[10px] text-white/32 uppercase tracking-[0.14em] font-medium">
                  Full name
                </Label>
                <Input
                  id="name"
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/18 focus:border-zo-purple/50 focus:bg-white/[0.06] transition-colors rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] text-white/32 uppercase tracking-[0.14em] font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={intent === 'internal' ? 'name@zeroorigins.in' : 'you@company.com'}
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
                  minLength={6}
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
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href={`/login${intent ? `?intent=${intent}` : ''}`}
              className="text-xs text-white/38 hover:text-white/65 transition-colors"
            >
              Already have an account? Sign in
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

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
          <div className="w-5 h-5 border-2 border-zo-purple/50 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
