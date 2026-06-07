'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { INTERNAL_ROLES } from '@/types'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
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

      // After signup, profile is created via trigger. 
      // We check for profile to be safe, but usually it's CUSTOMER.
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 mb-2 text-center">
        <h1 className="text-2xl font-bold text-zo-chrome">Create Account</h1>
        <p className="text-sm text-zo-muted">Join the ZeroOrigins ecosystem</p>
      </div>

      <Card className="border-border bg-card shadow-2xl">
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4 pt-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive font-medium">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zo-muted text-xs uppercase tracking-widest font-bold">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zo-muted text-xs uppercase tracking-widest font-bold">Email</Label>
              <Input id="email" type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
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
            <Link href="/login" className="text-sm text-zo-muted hover:text-zo-purple transition-colors">
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
