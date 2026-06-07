'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
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

      // Fetch user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        // If profile is missing but user exists, they are likely a CUSTOMER (default)
        // but we should ideally show a message if we can't find the profile.
        setError('User profile not found. Please contact support.')
        setLoading(false)
        return
      }

      const role = profile.role
      let redirectPath = '/portal/customer/dashboard'

      if (['SUPER_ADMIN', 'FOUNDER', 'DIRECTOR', 'STAFF', 'CONTRACTOR'].includes(role)) {
        redirectPath = '/internal/control-room'
      } else if (role === 'PARTNER' || role === 'REFERRAL_PARTNER') {
        redirectPath = '/portal/partner/dashboard'
      }

      router.push(redirectPath)
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4 pt-6">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/signup" className="hover:text-foreground">Create account</Link>
            <Link href="/forgot-password" className="hover:text-foreground">Forgot password?</Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
