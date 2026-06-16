'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if session already exists (came via /auth/callback PKCE exchange)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    // Also handle implicit flow: Supabase auto-parses hash and fires PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Image src="/logo.png" alt="ZeroOrigins" width={48} height={48} className="w-12 h-12" priority />
            </div>
            <div className="space-y-3">
              <div className="flex justify-center">
                <CheckCircle2 className="w-10 h-10 text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Password updated</h1>
              <p className="text-white/60">Redirecting you to login…</p>
            </div>
          </div>
          <Card className="zo-glass-elevated border-white/10 backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <Link href="/login" className="w-full h-12 flex items-center justify-center rounded-xl font-semibold zo-button-primary text-white">
                Go to Login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Image src="/logo.png" alt="ZeroOrigins" width={48} height={48} className="w-12 h-12" priority />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-white">Reset Password</h1>
              <p className="text-white/60 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying reset link…
              </p>
            </div>
          </div>
          <Card className="zo-glass-elevated border-white/10 backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-white/50">
                If this takes too long, your reset link may have expired.{' '}
                <Link href="/forgot-password" className="text-purple-300 hover:text-purple-200">
                  Request a new one.
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Image src="/logo.png" alt="ZeroOrigins" width={48} height={48} className="w-12 h-12" priority />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white">Set New Password</h1>
            <p className="text-white/60">Choose a strong password for your account.</p>
          </div>
        </div>

        <Card className="zo-glass-elevated border-white/10 backdrop-blur-xl">
          <form onSubmit={handleReset}>
            <CardContent className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300 leading-relaxed">
                  {error}
                </div>
              )}
              <div className="space-y-3">
                <Label htmlFor="password" className="text-white/80 font-medium">
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="confirm" className="text-white/80 font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring"
                />
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0 flex-col gap-6">
              <Button
                type="submit"
                className="w-full h-12 zo-button-primary text-white font-semibold"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Updating…' : 'Update Password'}
              </Button>
              <Link href="/login" className="text-sm text-white/60 hover:text-white zo-motion-safe">
                Back to Login
              </Link>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-xs text-white/40 hover:text-white/60 zo-motion-safe uppercase tracking-wide">
            ← Back to Gateway
          </Link>
        </div>
      </div>
    </div>
  )
}
