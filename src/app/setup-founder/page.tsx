'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import { promoteToFounder } from '@/lib/actions/auth'

import { type User } from '@supabase/supabase-js'
import { type Profile } from '@/types'

export default function SetupFounderPage() {
  const [loading, setLoading] = useState(true)
  const [promoting, setPromoting] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [canBootstrap, setCanBootstrap] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function checkBootstrapStatus() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/login')
          return
        }
        setUser(authUser)

        // Check if any Founder or Super Admin exists
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .in('role', ['FOUNDER', 'SUPER_ADMIN'])

        if (countError) throw countError

        if (count && count > 0) {
          setCanBootstrap(false)
        } else {
          setCanBootstrap(true)
        }

        // Get current profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        setProfile(profileData)
      } catch (err: unknown) {
        console.error('Setup check error:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    checkBootstrapStatus()
  }, [supabase, router])

  async function handlePromote() {
    if (!user || !canBootstrap) return
    
    setPromoting(true)
    setError('')

    try {
      const result = await promoteToFounder()
      if (result.success) {
        router.push('/internal/control-room')
        router.refresh()
      }
    } catch (err: unknown) {
      console.error('Promotion error:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      setPromoting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zo-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zo-purple" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zo-black flex flex-col items-center justify-center p-6 selection:bg-zo-purple/30">
      <div className="max-w-md w-full">
        <Card className="border-border bg-card shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative w-20 h-20">
                <Image src="/logo.png" alt="Logo" fill className="object-contain animate-pulse-slow" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-zo-chrome">Founder Setup</CardTitle>
            <CardDescription className="text-zo-muted">ZeroOrigins OS First Admin Bootstrap</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-border/50">
              <div className="space-y-1">
                <p className="text-xs text-zo-muted uppercase tracking-widest font-bold">Current Account</p>
                <p className="text-sm font-medium text-zo-chrome">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zo-muted uppercase tracking-widest font-bold">Current Role</p>
                <p className="text-sm font-bold text-zo-purple-2 uppercase">{profile?.role || 'CUSTOMER'}</p>
              </div>
            </div>

            {canBootstrap ? (
              <div className="space-y-4">
                <p className="text-xs text-zo-muted text-center leading-relaxed">
                  No Founder account found in the system. 
                  Promote this account to <span className="text-zo-purple-2 font-bold uppercase">FOUNDER</span> to unlock the internal workspace.
                </p>
                <Button 
                  onClick={handlePromote} 
                  disabled={promoting}
                  className="w-full font-bold h-12 shadow-lg shadow-zo-purple/20"
                >
                  {promoting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Promoting Account...
                    </>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      Promote Me to Founder
                    </span>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                  <p className="text-xs text-destructive font-medium">
                    A Founder or Super Admin already exists. Manual bootstrap is disabled.
                  </p>
                </div>
                <p className="text-sm text-zo-muted text-center italic">
                  Please contact the existing administrator to update your role.
                </p>
                <Button variant="secondary" className="w-full h-11 border-zo-border-soft" onClick={() => router.push('/')}>
                  Return Home
                </Button>
              </div>
            )}

            {error && (
              <p className="text-xs text-destructive text-center bg-destructive/5 p-3 rounded border border-destructive/10">
                Error: {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
