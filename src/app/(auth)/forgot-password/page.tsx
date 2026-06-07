'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) { setError(error.message); return }
    setSent(true)
  }

  if (sent) {
    return (
      <Card className="border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Check your email for a reset link.</p>
        <Link href="/login" className="text-sm text-zo-purple mt-4 inline-block">Back to login</Link>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <form onSubmit={handleReset}>
        <CardContent className="space-y-4 pt-6">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full">Send Reset Link</Button>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Back to login</Link>
        </CardFooter>
      </form>
    </Card>
  )
}
