import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { INTERNAL_ROLES } from '@/types'
import Image from 'next/image'
import { ShieldCheck, Building2, Handshake, LogOut, ArrowRight, UserCircle } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'

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
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 selection:bg-zo-amber/30">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
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
            <h1 className="text-5xl font-bold tracking-tight text-zo-chrome">ZeroOrigins OS</h1>
            <p className="text-zo-silver/60 italic text-lg">Company Operating System</p>
          </div>
        </div>

        {user ? (
          <div className="max-w-md mx-auto w-full">
            <Card className="border-border bg-card overflow-hidden shadow-2xl shadow-zo-amber/5">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-zo-amber/10 rounded-full flex items-center justify-center mb-2">
                  <UserCircle className="w-6 h-6 text-zo-amber" />
                </div>
                <CardTitle className="text-xl">Welcome Back</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="p-4 bg-secondary/30 rounded-lg space-y-2 border border-border/50">
                  <div className="flex justify-between items-center text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    <span>Identity</span>
                    <span className="text-zo-amber">{profile?.role || 'CUSTOMER'}</span>
                  </div>
                  <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                </div>

                <div className="grid gap-3">
                  {INTERNAL_ROLES.includes(profile?.role) ? (
                    <Button className="w-full h-12 bg-zo-amber hover:bg-zo-amber/90 text-black font-bold shadow-lg shadow-zo-amber/20">
                      <Link href="/internal/control-room" className="flex items-center">
                        Enter Control Room <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  ) : noFounderExists ? (
                    <Button className="w-full h-12 bg-zo-amber hover:bg-zo-amber/90 text-black font-bold shadow-lg shadow-zo-amber/20 animate-pulse">
                      <Link href="/setup-founder" className="flex items-center">
                        Complete Founder Setup <ShieldCheck className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  ) : profile?.role === 'PARTNER' || profile?.role === 'REFERRAL_PARTNER' ? (
                    <Button className="w-full h-12 bg-zo-amber hover:bg-zo-amber/90 text-black font-bold">
                      <Link href="/portal/partner/dashboard" className="flex items-center">
                        Open Partner Portal <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button className="w-full h-12 bg-zo-amber hover:bg-zo-amber/90 text-black font-bold">
                      <Link href="/portal/customer/dashboard" className="flex items-center">
                        Open Customer Portal <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                  
                  <form action={signOut} className="w-full">
                    <Button type="submit" variant="ghost" className="w-full h-10 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <LogOut className="mr-2 w-4 h-4" /> Sign Out
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Internal Workspace */}
            <Card className="border-border bg-card flex flex-col hover:border-zo-amber/50 transition-all group shadow-xl shadow-black">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-zo-amber/10 rounded-full flex items-center justify-center mb-2 group-hover:bg-zo-amber/20 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-zo-amber" />
                </div>
                <CardTitle className="text-lg">Internal Workspace</CardTitle>
                <CardDescription className="text-xs h-8">
                  For founders, directors, staff, and operators.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto p-6 pt-0 space-y-3">
                {noFounderExists ? (
                  <Button className="w-full bg-zo-amber hover:bg-zo-amber/90 text-black font-bold">
                    <Link href="/setup-founder">Set up Founder</Link>
                  </Button>
                ) : (
                  <Button className="w-full bg-zo-amber hover:bg-zo-amber/90 text-black font-bold">
                    <Link href="/login?intent=internal">Internal Login</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Customer Portal */}
            <Card className="border-border bg-card flex flex-col hover:border-zo-silver/50 transition-all group shadow-xl shadow-black">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-zo-silver/10 rounded-full flex items-center justify-center mb-2 group-hover:bg-zo-silver/20 transition-colors">
                  <Building2 className="w-6 h-6 text-zo-silver" />
                </div>
                <CardTitle className="text-lg">Customer Portal</CardTitle>
                <CardDescription className="text-xs h-8">
                  For clients requesting or tracking work.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto p-6 pt-0 space-y-3">
                <Button className="w-full bg-zo-silver hover:bg-zo-silver/90 text-black font-bold">
                  <Link href="/login?intent=customer">Customer Login</Link>
                </Button>
                <Button variant="outline" className="w-full text-xs">
                  <Link href="/request-build">Request a Build</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Partner Portal */}
            <Card className="border-border bg-card flex flex-col hover:border-zo-amber/30 transition-all group shadow-xl shadow-black">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-zo-amber/5 rounded-full flex items-center justify-center mb-2 group-hover:bg-zo-amber/10 transition-colors">
                  <Handshake className="w-6 h-6 text-zo-amber/70" />
                </div>
                <CardTitle className="text-lg">Partner Portal</CardTitle>
                <CardDescription className="text-xs h-8">
                  For referral partners and collaborators.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto p-6 pt-0 space-y-3">
                <Button className="w-full bg-zo-amber/10 hover:bg-zo-amber/20 text-zo-amber font-bold border-zo-amber/20">
                  <Link href="/login?intent=partner">Partner Login</Link>
                </Button>
                <Button variant="outline" className="w-full text-xs border-zo-amber/10 text-zo-amber/70 hover:text-zo-amber">
                  <Link href="/partner-with-us">Partner With Us</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-medium opacity-50">
            Powered by ZeroOrigins OS v0.1.0
          </p>
        </div>
      </div>
    </div>
  )
}
