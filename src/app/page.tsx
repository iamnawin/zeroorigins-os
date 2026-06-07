import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/sign-out-button'
import Link from 'next/link'
import { INTERNAL_ROLES } from '@/types'
import Image from 'next/image'
import { ShieldCheck, Building2 } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  let founderCount = 0
  if (user) {
    const [{ data: profileData }, { count }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['FOUNDER', 'SUPER_ADMIN'])
    ])
    profile = profileData
    founderCount = count || 0
  }

  const noFounderExists = user && founderCount === 0

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative w-24 h-24">
              <Image 
                src="/logo.png" 
                alt="ZeroOrigins Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-zo-chrome">ZeroOrigins OS</h1>
            <p className="text-muted-foreground italic">Company Operating System</p>
          </div>
        </div>

        <Card className="border-border bg-card overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {user ? 'Welcome Back' : 'Select Portal'}
            </CardTitle>
            <CardDescription>
              {user ? `Signed in as ${user.email}` : 'Access your ZeroOrigins workspace'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {user ? (
              <div className="p-6 space-y-4">
                <div className="p-3 bg-secondary/50 rounded-lg space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Account Status</p>
                  <p className="text-sm">Role: <span className="text-zo-amber font-medium">{profile?.role || 'CUSTOMER'}</span></p>
                </div>

                <div className="grid gap-3 pt-2">
                  {INTERNAL_ROLES.includes(profile?.role) ? (
                    <Button className="w-full h-12 bg-zo-amber hover:bg-zo-amber/90 text-black font-bold">
                      <Link href="/internal/control-room" className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        Enter Control Room
                      </Link>
                    </Button>
                  ) : noFounderExists ? (
                    <Button className="w-full h-12 bg-zo-amber hover:bg-zo-amber/90 text-black font-bold">
                      <Link href="/setup-founder" className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        Complete Founder Setup
                      </Link>
                    </Button>
                  ) : profile?.role === 'PARTNER' || profile?.role === 'REFERRAL_PARTNER' ? (
                    <Button className="w-full h-12 bg-zo-amber hover:bg-zo-amber/90 text-black font-bold">
                      <Link href="/portal/partner/dashboard" className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Open Partner Portal
                      </Link>
                    </Button>
                  ) : (
                    <Button className="w-full h-12 bg-zo-amber hover:bg-zo-amber/90 text-black font-bold">
                      <Link href="/portal/customer/dashboard" className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Open Customer Portal
                      </Link>
                    </Button>
                  )}
                  <SignOutButton className="w-full" variant="ghost" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col border-t border-border">
                <Link 
                  href="/login" 
                  className="flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors group border-b border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-zo-amber/10 rounded-full group-hover:bg-zo-amber/20 transition-colors">
                      <ShieldCheck className="w-6 h-6 text-zo-amber" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-foreground">Internal Access</p>
                      <p className="text-xs text-muted-foreground">Founders, Admins & Staff</p>
                    </div>
                  </div>
                  <div className="text-zo-amber opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                    →
                  </div>
                </Link>
                
                <Link 
                  href="/login" 
                  className="flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-zo-silver/10 rounded-full group-hover:bg-zo-silver/20 transition-colors">
                      <Building2 className="w-6 h-6 text-zo-silver" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-foreground">Business Portal</p>
                      <p className="text-xs text-muted-foreground">Customers & Partners</p>
                    </div>
                  </div>
                  <div className="text-zo-silver opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                    →
                  </div>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {!user && (
          <div className="flex justify-center gap-6 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
            <Link href="/request-build" className="hover:text-zo-amber transition-colors">Request a Build</Link>
            <span className="opacity-30">|</span>
            <Link href="/partner-with-us" className="hover:text-zo-amber transition-colors">Partner with Us</Link>
          </div>
        )}

        {user && !INTERNAL_ROLES.includes(profile?.role) && !noFounderExists && (
          <p className="text-center text-xs text-muted-foreground px-4 italic">
            Note: This account is currently in the business portal.
          </p>
        )}
      </div>
    </div>
  )
}
