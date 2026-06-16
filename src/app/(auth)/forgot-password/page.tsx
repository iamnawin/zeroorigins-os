'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
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
              <p className="text-white/60">Reset instructions sent to</p>
              <p className="text-purple-300 font-medium">{email}</p>
            </div>
          </div>

          <Card className="zo-glass-elevated border-white/10 backdrop-blur-xl">
            <CardContent className="p-8 text-center space-y-6">
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <p className="text-sm text-white/80 leading-relaxed">
                  Click the link in your email to reset your password and regain access to your account.
                </p>
              </div>
              <Link href="/login" className="w-full h-12 flex items-center justify-center rounded-xl font-semibold zo-button-primary text-white">
                Back to Login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
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
            <h1 className="text-3xl font-bold text-white">Reset Password</h1>
            <p className="text-white/60">Enter your email to receive reset instructions.</p>
          </div>
        </div>

        {/* Reset Card */}
        <Card className="zo-glass-elevated border-white/10 backdrop-blur-xl">
          <form onSubmit={handleReset}>
            <CardContent className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300 leading-relaxed">
                  {error}
                </div>
              )}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-white/80 font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Link
                href="/login"
                className="text-sm text-white/60 hover:text-white zo-motion-safe"
              >
                Back to Login
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
    </div>
  )
}
