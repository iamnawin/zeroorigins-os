'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'
import type { Role } from '@/types'
import { ChevronDown, LogOut, User, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface InternalTopNavProps {
  email?: string
  fullName?: string | null
  role?: Role
}

const primaryNav = [
  { label: 'Dashboard', href: '/internal/control-room' },
]

const studioNav = [
  { label: 'Ideas', href: '/internal/ideas' },
  { label: 'Projects', href: '/internal/projects' },
  { label: 'Tasks', href: '/internal/tasks' },
]

const salesNav = [
  { label: 'Leads', href: '/internal/leads' },
  { label: 'Partners', href: '/internal/partners' },
  { label: 'Customers', href: '/internal/customers' },
]

const workspaceNav = [
  { label: 'AI Workspace', href: '/internal/ai-workspace' },
]

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')
  
  return (
    <Link
      href={href}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium zo-motion-safe relative",
        isActive 
          ? "bg-purple-500/20 text-purple-300 shadow-sm" 
          : "text-white/70 hover:text-white hover:bg-white/5"
      )}
    >
      {isActive && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-purple-400 rounded-full" />
      )}
      {label}
    </Link>
  )
}

function Divider() {
  return <div className="w-px h-6 bg-white/10" />
}

export function InternalTopNav({ email, fullName, role }: InternalTopNavProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 backdrop-blur-xl bg-black/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/internal/control-room" className="flex items-center space-x-3 zo-motion-safe hover:opacity-80">
            <Image
              src="/logo.png"
              alt="ZeroOrigins"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="font-bold text-white text-lg">ZeroOrigins</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {/* Primary Navigation */}
            {primaryNav.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
            
            <Divider />
            
            {/* Studio Navigation */}
            {studioNav.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
            
            <Divider />
            
            {/* Sales Navigation */}
            {salesNav.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
            
            <Divider />
            
            {/* Workspace Navigation */}
            {workspaceNav.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/5 zo-motion-safe text-white/80 hover:text-white">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <User className="w-4 h-4 text-purple-300" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-white">
                  {fullName || email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-white/50 capitalize">
                  {role?.toLowerCase()}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-white/50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-black/90 backdrop-blur-xl border-white/10">
              <div className="px-3 py-2 border-b border-white/10">
                <p className="text-sm font-medium text-white">{fullName || 'User'}</p>
                <p className="text-xs text-white/60">{email}</p>
              </div>
              <DropdownMenuItem asChild>
                <Link href="/internal/settings" className="flex items-center text-white/80 hover:text-white">
                  <Settings className="mr-2 w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild>
                <form action={signOut} className="w-full">
                  <button type="submit" className="w-full flex items-center text-white/80 hover:text-white">
                    <LogOut className="mr-2 w-4 h-4" />
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
}

function Divider() {
  return <span className="w-px h-4 bg-border mx-0.5 shrink-0" />
}

export function InternalTopNav({ email, fullName, role }: InternalTopNavProps) {
  const displayName = fullName || email?.split('@')[0] || 'Account'
  const isAdmin = role === 'admin'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="h-full max-w-screen-2xl mx-auto flex items-center justify-between px-4 gap-4">

        {/* Logo + Brand */}
        <Link href="/internal/control-room" className="flex items-center gap-2.5 shrink-0">
          {/* invert in light mode — the chrome mark is designed for dark surfaces */}
          <div className="relative w-6 h-6">
            <Image src="/logo.png" alt="ZO" fill className="object-contain invert dark:invert-0" />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground hidden sm:block">
            ZeroOrigins
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0.5 flex-1 justify-center overflow-x-auto no-scrollbar">
          {primaryNav.map(item => <NavLink key={item.href} {...item} />)}
          <Divider />
          {studioNav.map(item => <NavLink key={item.href} {...item} />)}
          <Divider />
          {salesNav.map(item => <NavLink key={item.href} {...item} />)}
          <Divider />
          {workspaceNav.map(item => <NavLink key={item.href} {...item} />)}
        </nav>

        {/* User menu */}
        <div className="flex items-center gap-2 shrink-0">
          {role && (
            <span className="hidden md:inline-flex text-[10px] font-bold uppercase tracking-wider text-zo-purple bg-zo-purple/10 dark:bg-zo-purple/15 px-2 py-0.5 rounded-full">
              {role}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none cursor-pointer">
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="max-w-[100px] truncate hidden sm:block">{displayName}</span>
              <ChevronDown className="w-3 h-3 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-2">
                <p className="text-xs font-semibold text-foreground truncate">{fullName || displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{email}</p>
                {role && (
                  <span className="mt-1.5 inline-flex text-[9px] font-bold uppercase tracking-widest text-zo-purple bg-zo-purple/10 px-1.5 py-0.5 rounded">
                    {role}
                  </span>
                )}
              </div>
              <DropdownMenuSeparator />
              {isAdmin && (
                <>
                  <DropdownMenuItem className="p-0">
                    <Link href="/internal/finance" className="flex items-center gap-2 text-xs px-1.5 py-1 w-full">
                      <DollarSign className="w-3.5 h-3.5" /> Finance
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-0">
                    <Link href="/internal/settings" className="flex items-center gap-2 text-xs px-1.5 py-1 w-full">
                      <Settings className="w-3.5 h-3.5" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem className="p-0">
                <form action={signOut} className="w-full">
                  <button type="submit" className="flex items-center gap-2 text-xs px-1.5 py-1 w-full text-muted-foreground">
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </header>
  )
}
