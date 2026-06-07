import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/sign-out-button'
import Link from 'next/link'
import { INTERNAL_ROLES } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-zo-chrome">ZeroOrigins OS</h1>
          <p className="text-muted-foreground italic">Company Operating System</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-xl">
              {user ? 'Welcome Back' : 'Get Started'}
            </CardTitle>
            <CardDescription>
              {user ? `Signed in as ${user.email}` : 'Sign in to access your workspace'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <>
                <div className="p-3 bg-secondary/50 rounded-lg space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Account Status</p>
                  <p className="text-sm">Role: <span className="text-zo-amber font-medium">{profile?.role || 'CUSTOMER'}</span></p>
                </div>

                <div className="grid gap-3 pt-2">
                  {INTERNAL_ROLES.includes(profile?.role) ? (
                    <Button className="w-full bg-zo-amber hover:bg-zo-amber/90 text-black">
                      <Link href="/internal/control-room">Enter Control Room</Link>
                    </Button>
                  ) : profile?.role === 'PARTNER' || profile?.role === 'REFERRAL_PARTNER' ? (
                    <Button className="w-full bg-zo-amber hover:bg-zo-amber/90 text-black">
                      <Link href="/portal/partner/dashboard">Open Partner Portal</Link>
                    </Button>
                  ) : (
                    <Button className="w-full bg-zo-amber hover:bg-zo-amber/90 text-black">
                      <Link href="/portal/customer/dashboard">Open Customer Portal</Link>
                    </Button>
                  )}
                  <SignOutButton className="w-full" variant="outline" />
                </div>
              </>
            ) : (
              <div className="grid gap-3 pt-2">
                <Button className="w-full">
                  <Link href="/login">Sign In</Link>
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="text-xs">
                    <Link href="/request-build">Request a Build</Link>
                  </Button>
                  <Button variant="outline" className="text-xs">
                    <Link href="/partner-with-us">Partner With Us</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {user && !INTERNAL_ROLES.includes(profile?.role) && (
          <p className="text-center text-xs text-muted-foreground px-4">
            Internal workspace access requires a Founder or Staff account.
          </p>
        )}
      </div>
    </div>
  )
}
