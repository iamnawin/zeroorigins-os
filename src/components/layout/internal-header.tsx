import { createClient } from '@/lib/supabase/server'
import { LogOut } from 'lucide-react'
import { redirect } from 'next/navigation'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function InternalHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user?.id ?? '').single()

  return (
    <header className="h-12 border-b border-border bg-[#090909] flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground">
          {profile?.full_name || user?.email} <span className="text-zo-amber/60">({profile?.role})</span>
        </span>
        <form action={signOut}>
          <button type="submit" className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </header>
  )
}
