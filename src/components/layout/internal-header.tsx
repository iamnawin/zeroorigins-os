import { LogOut, UserCircle } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import type { Role } from '@/types'

interface InternalHeaderProps {
  email?: string
  role?: Role
}

export function InternalHeader({ email, role }: InternalHeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-zo-black-2/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8 selection:bg-zo-purple/20">
      <div className="flex items-center gap-3">
        <UserCircle className="w-4 h-4 text-zo-muted" />
        <span className="text-xs font-medium text-zo-muted">{email}</span>
        {role && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-zo-purple-2 bg-zo-purple/5 border border-zo-purple/20 px-2 py-0.5 rounded">
            {role.replace('_', ' ')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.2em] text-zo-dim">ZeroOrigins Internal</span>
        <form action={signOut}>
          <button type="submit" className="text-zo-muted hover:text-destructive transition-all p-2 hover:bg-destructive/5 rounded-full" title="Sign Out">
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </header>
  )
}
