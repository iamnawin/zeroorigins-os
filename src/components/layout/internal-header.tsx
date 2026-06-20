'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  AppWindow,
  BookOpen,
  Bot,
  Building2,
  CalendarDays,
  CalendarSync,
  CheckSquare,
  ChevronDown,
  CirclePlus,
  DollarSign,
  FileText,
  FolderKanban,
  Handshake,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  PanelsTopLeft,
  Search,
  Settings,
  User,
  Users,
  WalletCards,
  Workflow,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'
import { filterInternalNavGroups } from '@/lib/internal-navigation'
import { NotificationBell, type NotificationBellItem } from '@/components/notifications/notification-bell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { Role } from '@/types'

interface InternalHeaderProps {
  email?: string
  fullName?: string | null
  role?: Role
  notifications?: NotificationBellItem[]
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

const ICONS: Record<string, LucideIcon> = {
  AppWindow,
  BookOpen,
  Bot,
  Building2,
  CalendarDays,
  CheckSquare,
  DollarSign,
  FileText,
  FolderKanban,
  Handshake,
  LayoutDashboard,
  Lightbulb,
  PanelsTopLeft,
  Settings,
  Users,
  WalletCards,
  Workflow,
}

export function InternalHeader({ email, fullName, role, notifications = [] }: InternalHeaderProps) {
  const [query, setQuery] = useState('')
  const pathname = usePathname()
  const displayName = fullName || email?.split('@')[0] || 'Account'
  const groups = filterInternalNavGroups(role)

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex min-h-14 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 lg:px-6">
        <Sheet>
          <SheetTrigger className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-foreground lg:hidden">
            <Menu className="h-4 w-4" />
            Menu
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(88vw,22rem)] gap-0 overflow-y-auto p-0">
            <SheetHeader className="border-b border-border p-4 text-left">
              <SheetTitle>ZeroOrigins OS</SheetTitle>
              <SheetDescription>Workspace navigation</SheetDescription>
            </SheetHeader>
            <nav className="space-y-5 px-3 py-4">
              {groups.map(group => (
                <section key={group.id} className="space-y-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{group.label}</p>
                  {group.items.map(item => {
                    const Icon = ICONS[item.icon] || LayoutDashboard
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                      <SheetClose key={item.href} render={<Link href={item.href} />}>
                        <span
                          className={cn(
                            'flex items-center gap-2 rounded-md px-2.5 py-2.5 text-sm transition-colors',
                            active
                              ? 'bg-zo-purple/15 text-zo-purple-2'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </span>
                      </SheetClose>
                    )
                  })}
                </section>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

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

        <NotificationBell notifications={notifications} />

        <Link href="/internal/automation?tab=calendar-sync" className="ml-auto sm:ml-0">
          <Button size="sm" variant="outline" className="shrink-0">
            <CalendarSync className="mr-1 h-4 w-4" />
            Sync
          </Button>
        </Link>

        <Link href="/internal/automation" className="hidden sm:block">
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
