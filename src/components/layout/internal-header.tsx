import { createClient } from '@/lib/supabase/server'
import { LogOut, UserCircle } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'

export async function InternalHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="h-16 border-b border-border bg-zo-black-2/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8 selection:bg-zo-purple/20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-zo-muted">
          <UserCircle className="w-4 h-4" />
          <span className="text-xs font-medium">{user?.email}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form action={signOut}>
          <button type="submit" className="text-zo-muted hover:text-destructive transition-all p-2 hover:bg-destructive/5 rounded-full" title="Sign Out">
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </header>
  )
}
