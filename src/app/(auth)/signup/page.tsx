'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
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
      
      const { count: founderCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['FOUNDER', 'SUPER_ADMIN'])

      if (intent === 'internal' && (founderCount === 0 || founderCount === null)) {
        router.push('/setup-founder')
        return
      }

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
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-2 mb-2 text-center">
          <h1 className="text-2xl font-bold text-zo-chrome">Check your email</h1>
          <p className="text-sm text-zo-muted italic font-medium">Verification link sent to {email}</p>
        </div>

        <Card className="border-border bg-card shadow-2xl">
          <CardContent className="pt-8 text-center space-y-6">
            <div className="p-3 bg-zo-purple/5 border border-zo-purple/20 rounded-lg">
              <p className="text-sm text-zo-muted leading-relaxed">
                Please click the link in your inbox to verify your ZeroOrigins account.
              </p>
            </div>
            <Button className="w-full font-bold h-11">
              <Link href="/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 mb-2 text-center">
        <h1 className="text-2xl font-bold text-zo-chrome">
          {intent === 'internal' ? 'Internal Signup' : 'Create Account'}
        </h1>
        <p className="text-sm text-zo-muted">Join the ZeroOrigins ecosystem</p>
      </div>

      <Card className="border-border bg-card shadow-2xl">
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4 pt-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive font-medium leading-relaxed">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zo-muted text-xs uppercase tracking-widest font-bold">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zo-muted text-xs uppercase tracking-widest font-bold">Email</Label>
              <Input id="email" type="email" placeholder={intent === 'internal' ? "name@zeroorigins.in" : "name@company.com"} value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zo-muted text-xs uppercase tracking-widest font-bold">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full font-bold h-11" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
            <Link href={`/login${intent ? `?intent=${intent}` : ''}`} className="text-sm text-zo-muted hover:text-zo-purple transition-colors">
              Already have an account? Sign in
            </Link>
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
