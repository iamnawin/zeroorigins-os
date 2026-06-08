import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { INTERNAL_ROLES } from '@/types'
import Image from 'next/image'
import { ShieldCheck, Building2, Handshake } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    profile = data
  }

  return (
    <div className="min-h-screen bg-zo-black flex flex-col items-center justify-center p-6 selection:bg-zo-purple/30">
      <div className="max-w-5xl w-full space-y-12 py-12">
        {/* Logo & Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <Image 
                src="/logo.png" 
                alt="ZeroOrigins Logo" 
                fill 
                className="object-contain animate-pulse-slow"
                priority
              />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-bold tracking-tight text-zo-chrome">ZeroOrigins OS</h1>
            <p className="text-zo-silver/60 italic text-lg">Company Operating System</p>
          </div>
        </div>

        {/* Three-Path Gateway */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Internal Workspace */}
          <Card className="border-border bg-card flex flex-col hover:border-zo-purple/50 transition-all group shadow-xl shadow-black relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
              <ShieldCheck className="w-12 h-12 text-zo-purple" />
            </div>
            <CardHeader>
              <div className="w-10 h-10 bg-zo-purple/10 rounded flex items-center justify-center mb-4 group-hover:bg-zo-purple/20 transition-colors">
                <ShieldCheck className="w-5 h-5 text-zo-purple" />
              </div>
              <CardTitle className="text-xl">Internal Workspace</CardTitle>
              <CardDescription className="text-xs min-h-[40px] text-zo-muted leading-relaxed">
                For ZeroOrigins team members using <span className="text-zo-purple-2 font-medium">@zeroorigins.in</span> email.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto p-6 pt-0 space-y-3">
              <div className="grid gap-2">
                <Button variant={user && INTERNAL_ROLES.includes(profile?.role) ? "secondary" : "default"} className="w-full font-bold">
                  <Link href="/login?intent=internal">Internal Login</Link>
                </Button>
                <Button variant="secondary" className="w-full text-xs border-zo-border-soft">
                  <Link href="/signup?intent=internal">Internal Signup</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customer Portal */}
          <Card className="border-border bg-card flex flex-col hover:border-zo-silver/40 transition-all group shadow-xl shadow-black relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-20 transition-opacity">
              <Building2 className="w-12 h-12 text-zo-silver" />
            </div>
            <CardHeader>
              <div className="w-10 h-10 bg-zo-silver/5 rounded flex items-center justify-center mb-4 group-hover:bg-zo-silver/10 transition-colors">
                <Building2 className="w-5 h-5 text-zo-silver" />
              </div>
              <CardTitle className="text-xl">Customer Portal</CardTitle>
              <CardDescription className="text-xs min-h-[40px] text-zo-muted leading-relaxed">
                For clients requesting AI systems, automations, and digital infrastructure.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto p-6 pt-0 space-y-3">
              <div className="grid gap-2">
                <Button variant="secondary" className="w-full font-bold border-zo-border-soft">
                  <Link href="/login?intent=customer">Customer Login</Link>
                </Button>
                <Button variant="outline" className="w-full text-xs border-zo-border-soft">
                  <Link href="/request-build">Request a Build</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Partner Portal */}
          <Card className="border-border bg-card flex flex-col hover:border-zo-purple/30 transition-all group shadow-xl shadow-black relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
              <Handshake className="w-12 h-12 text-zo-purple" />
            </div>
            <CardHeader>
              <div className="w-10 h-10 bg-zo-purple/5 rounded flex items-center justify-center mb-4 group-hover:bg-zo-purple/10 transition-colors">
                <Handshake className="w-5 h-5 text-zo-purple/70" />
              </div>
              <CardTitle className="text-xl">Partner Portal</CardTitle>
              <CardDescription className="text-xs min-h-[40px] text-zo-muted leading-relaxed">
                For collaborators, referral partners, and implementation partners.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto p-6 pt-0 space-y-3">
              <div className="grid gap-2">
                <Button variant="secondary" className="w-full font-bold border-zo-border-soft">
                  <Link href="/login?intent=partner">Partner Login</Link>
                </Button>
                <Button variant="outline" className="w-full text-xs border-zo-border-soft">
                  <Link href="/partner-with-us">Partner With Us</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="text-center pt-8 space-y-2">
          <p className="text-[10px] text-zo-muted uppercase tracking-[0.4em] font-bold opacity-40">
            Automated by ZeroOrigins OS
          </p>
          <p className="text-[9px] text-zo-muted/30">Version 0.1.0-VIOLET</p>
        </div>
      </div>
    </div>
  )
}
