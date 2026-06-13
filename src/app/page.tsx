import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { INTERNAL_ROLES } from '@/types'
import Image from 'next/image'
import { ShieldCheck, Building2, Handshake, ArrowRight } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    profile = data
  }

  return (
    <div className="dark min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.18),transparent_60%)]" />
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 zo-grid-pattern opacity-20" />
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl w-full space-y-16 py-16">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-8">
            <Image
              src="/wordmark.png"
              alt="ZeroOrigins"
              width={560}
              height={187}
              className="w-full max-w-[480px] h-auto opacity-90"
              priority
            />
          </div>
          <div className="space-y-3">
            <p className="text-white/40 text-sm font-medium tracking-wider uppercase">Company Operating System • v2.0</p>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
              Choose your operating layer.
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
              Access the internal workspace, client portal, or partner channel from one secure gateway.
            </p>
          </div>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Internal Workspace */}
          <Card className="group relative overflow-hidden zo-glass hover:zo-glass-elevated zo-motion-safe border-white/10 hover:border-purple-500/30">
            {/* Accent glow */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60 group-hover:opacity-100 zo-motion-safe" />
            
            {/* Background watermark */}
            <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 zo-motion-safe">
              <ShieldCheck className="w-16 h-16 text-purple-400" />
            </div>
            
            <CardHeader className="relative z-10 pb-6">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/15 zo-motion-safe ring-1 ring-purple-500/20">
                <ShieldCheck className="w-6 h-6 text-purple-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-white mb-3">Internal Workspace</CardTitle>
              <CardDescription className="text-white/60 leading-relaxed min-h-[48px]">
                For active team members using <span className="text-purple-300 font-medium">@zeroorigins.in</span> accounts.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative z-10 space-y-4">
              <div className="space-y-3">
                <Link
                  href="/login?intent=internal"
                  className={cn(
                    "w-full h-12 flex items-center justify-center gap-2 rounded-xl font-semibold zo-motion-safe group/btn",
                    user && INTERNAL_ROLES.includes(profile?.role) 
                      ? "bg-white/10 text-white/90 border border-white/20 hover:bg-white/15" 
                      : "zo-button-primary text-white"
                  )}
                >
                  Internal Login
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 zo-motion-safe" />
                </Link>
                <Link 
                  href="/signup?intent=internal" 
                  className="w-full h-10 flex items-center justify-center rounded-lg font-medium bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:border-white/20 zo-motion-safe"
                >
                  Internal Signup
                </Link>
              </div>
              <p className="text-xs text-white/40 text-center italic">
                For active @zeroorigins.in accounts.
              </p>
            </CardContent>
          </Card>

          {/* Customer Portal */}
          <Card className="group relative overflow-hidden zo-glass hover:zo-glass-elevated zo-motion-safe border-white/10 hover:border-white/20">
            {/* Accent glow */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-40 group-hover:opacity-60 zo-motion-safe" />
            
            {/* Background watermark */}
            <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 zo-motion-safe">
              <Building2 className="w-16 h-16 text-white" />
            </div>
            
            <CardHeader className="relative z-10 pb-6">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-white/10 zo-motion-safe ring-1 ring-white/10">
                <Building2 className="w-6 h-6 text-white/70" />
              </div>
              <CardTitle className="text-2xl font-bold text-white mb-3">Customer Portal</CardTitle>
              <CardDescription className="text-white/60 leading-relaxed min-h-[48px]">
                For clients requesting AI systems, automations, and digital infrastructure.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative z-10 space-y-4">
              <div className="space-y-3">
                <Link 
                  href="/login?intent=customer" 
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-xl font-semibold bg-white/10 text-white/90 border border-white/20 hover:bg-white/15 hover:border-white/30 zo-motion-safe group/btn"
                >
                  Customer Login
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 zo-motion-safe" />
                </Link>
                <Link 
                  href="/request-build" 
                  className="w-full h-10 flex items-center justify-center rounded-lg font-medium bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:border-white/20 zo-motion-safe"
                >
                  Request a Build
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Partner Portal */}
          <Card className="group relative overflow-hidden zo-glass hover:zo-glass-elevated zo-motion-safe border-white/10 hover:border-purple-500/20">
            {/* Accent glow */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400/50 to-transparent opacity-50 group-hover:opacity-80 zo-motion-safe" />
            
            {/* Background watermark */}
            <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 zo-motion-safe">
              <Handshake className="w-16 h-16 text-purple-400" />
            </div>
            
            <CardHeader className="relative z-10 pb-6">
              <div className="w-12 h-12 bg-purple-500/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/10 zo-motion-safe ring-1 ring-purple-500/20">
                <Handshake className="w-6 h-6 text-purple-400/70" />
              </div>
              <CardTitle className="text-2xl font-bold text-white mb-3">Partner Portal</CardTitle>
              <CardDescription className="text-white/60 leading-relaxed min-h-[48px]">
                For collaborators, referral partners, and implementation partners.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative z-10 space-y-4">
              <div className="space-y-3">
                <Link 
                  href="/login?intent=partner" 
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-xl font-semibold bg-white/10 text-white/90 border border-white/20 hover:bg-white/15 hover:border-white/30 zo-motion-safe group/btn"
                >
                  Partner Login
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 zo-motion-safe" />
                </Link>
                <Link 
                  href="/partner-with-us" 
                  className="w-full h-10 flex items-center justify-center rounded-lg font-medium bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:border-white/20 zo-motion-safe"
                >
                  Partner With Us
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center pt-12 space-y-3">
          <p className="text-white/20 uppercase tracking-[0.3em] font-bold text-xs">
            ZeroOrigins Operating System
          </p>
          <p className="text-white/10 text-xs font-mono">v0.1.0-VIOLET</p>
        </div>
      </div>
    </div>
  )
}
