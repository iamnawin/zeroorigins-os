'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { INTERNAL_ROLES } from '@/types'
import { isZeroOriginsEmail } from '@/lib/supabase/auth-helpers'

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

  const intentLabels: Record<string, { title: string, subtitle: string, note?: string }> = {
    internal: { 
      title: 'Internal Signup', 
      subtitle: 'Create your ZeroOrigins workspace account.',
      note: 'Internal accounts require @zeroorigins.in email addresses.'
    },
    customer: { 
      title: 'Customer Signup', 
      subtitle: 'Create your client portal account.',
    },
    partner: { 
      title: 'Partner Signup', 
      subtitle: 'Join the ZeroOrigins partner network.',
    }
  }

  const currentIntent = intent ? intentLabels[intent] || { title: 'Create Account', subtitle: 'Join ZeroOrigins today.' } : { title: 'Create Account', subtitle: 'Join ZeroOrigins today.' }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Domain Validation for Internal Intent
    if (intent === 'internal' && !isZeroOriginsEmail(email)) {
      setError('Internal accounts require a @zeroorigins.in email address.')
      setLoading(false)
      return
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.signUp({
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

      // Check if email confirmation is required (Supabase returns a user but potentially no session)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Most cases where confirmation is enabled
        setSuccess(true)
        setLoading(false)
        return
      }

      // If we reach here, user is auto-confirmed or already logged in
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
      console.error('Signup error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md space-y-8">
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
            <h1 className="text-3xl font-bold text-white">Check your email</h1>
            <p className="text-white/60">Verification link sent to</p>
            <p className="text-purple-300 font-medium">{email}</p>
          </div>
        </div>

        <Card className="zo-glass-elevated border-white/10 backdrop-blur-xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <p className="text-sm text-white/80 leading-relaxed">
                Please click the link in your inbox to verify your ZeroOrigins account.
              </p>
            </div>
            <Link href="/login" className="w-full h-12 flex items-center justify-center rounded-xl font-semibold zo-button-primary text-white">
              Back to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    )
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
        <form onSubmit={handleSignup}>
          <CardContent className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300 leading-relaxed">
                {error}
              </div>
            )}
            <fieldset disabled={loading} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-white/80 font-medium">
                  Full Name
                </Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  required 
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="email" className="text-white/80 font-medium">
                  Email Address
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder={intent === 'internal' ? "name@zeroorigins.in" : "name@company.com"}
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
                  placeholder="Enter a secure password"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  minLength={6}
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
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
            
            <Link 
              href={`/login${intent ? `?intent=${intent}` : ''}`} 
              className="text-sm text-white/60 hover:text-white zo-motion-safe"
            >
              Already have an account? Sign in
            </Link>
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

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <div className="w-6 h-6 border-2 border-zo-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
