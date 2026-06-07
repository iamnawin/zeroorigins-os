'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react'

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
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)

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
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(profile)
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
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'FOUNDER',
          full_name: profile?.full_name || 'Naveen'
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      router.push('/internal/control-room')
      router.refresh()
    } catch (err: unknown) {
      console.error('Promotion error:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      setPromoting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zo-amber" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-zo-amber/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-zo-amber" />
            </div>
            <CardTitle className="text-2xl font-bold text-zo-chrome">Founder Setup</CardTitle>
            <CardDescription>ZeroOrigins OS First Admin Bootstrap</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-border">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Account</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Role</p>
                <p className="text-sm font-medium text-zo-amber">{profile?.role || 'CUSTOMER'}</p>
              </div>
            </div>

            {canBootstrap ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  No Founder account found in the system. 
                  Promote this account to <span className="text-foreground font-bold text-zo-amber">FOUNDER</span> to unlock the internal workspace.
                </p>
                <Button 
                  onClick={handlePromote} 
                  disabled={promoting}
                  className="w-full bg-zo-amber hover:bg-zo-amber/90 text-black font-bold h-11"
                >
                  {promoting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Promoting Account...
                    </>
                  ) : 'Promote Me to Founder'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                  <p className="text-xs text-destructive font-medium">
                    A Founder or Super Admin already exists. Manual bootstrap is disabled.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Please contact the existing administrator to update your role.
                </p>
                <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
                  Return Home
                </Button>
              </div>
            )}

            {error && (
              <p className="text-xs text-destructive text-center bg-destructive/5 p-2 rounded border border-destructive/10">
                Error: {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
