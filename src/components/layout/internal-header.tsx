'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CalendarSync, ChevronDown, CirclePlus, LogOut, Search, User, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Role } from '@/types'

interface InternalHeaderProps {
  email?: string
  fullName?: string | null
  role?: Role
}

const quickAddLinks = [
  { href: '/internal/leads/new', label: 'Lead' },
  { href: '/internal/deals/new', label: 'Deal' },
  { href: '/internal/tasks/new', label: 'Task' },
  { href: '/internal/meetings/new', label: 'Meeting' },
  { href: '/internal/finance/vendors/new', label: 'Vendor' },
  { href: '/internal/finance/expenses/new', label: 'Expense' },
  { href: '/internal/knowledge/new', label: 'Knowledge Note' },
]

export function InternalHeader({ email, fullName, role }: InternalHeaderProps) {
  const [query, setQuery] = useState('')
  const displayName = fullName || email?.split('@')[0] || 'Account'

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex min-h-14 flex-wrap items-center gap-2 overflow-x-auto px-3 py-2 sm:gap-3 sm:px-4 lg:px-6">
        <label className="relative hidden min-w-0 flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Global search"
            className="h-9 w-full max-w-lg rounded-md border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none focus:border-zo-purple/50"
          />
        </label>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
            <CirclePlus className="h-4 w-4" />
            Quick Add
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {quickAddLinks.map(item => (
              <DropdownMenuItem key={item.href} className="p-0">
                <Link href={item.href} className="w-full px-2 py-1.5 text-sm">{item.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link href="/internal/automation?tab=calendar-sync">
          <Button size="sm" variant="outline" className="shrink-0">
            <CalendarSync className="mr-1 h-4 w-4" />
            Sync
          </Button>
        </Link>

        <Link href="/internal/automation">
          <Button size="sm" variant="outline" className="shrink-0">
            <Zap className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Automation</span>
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            <User className="h-4 w-4" />
            <span className="hidden max-w-28 truncate sm:inline">{displayName}</span>
            <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-2">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
              {role && <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zo-purple">{role}</p>}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="p-0">
              <form action={signOut} className="w-full">
                <button type="submit" className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
