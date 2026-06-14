'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
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
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { filterInternalNavGroups } from '@/lib/internal-navigation'
import type { Role } from '@/types'

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

export function InternalSidebar({ role }: { role?: Role }) {
  const pathname = usePathname()
  const groups = filterInternalNavGroups(role)

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col border-r border-border bg-background/95 backdrop-blur">
      <Link href="/internal/control-room" className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="relative h-7 w-7">
          <Image src="/logo.png" alt="ZeroOrigins" fill className="object-contain invert dark:invert-0" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">ZeroOrigins OS</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Internal operating system</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {groups.map(group => (
          <section key={group.id} className="space-y-0.5">
            <p className="mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">{group.label}</p>
            {group.items.map(item => {
              const Icon = ICONS[item.icon] || LayoutDashboard
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                    active
                      ? 'bg-zo-purple/12 font-medium text-white'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-zo-purple' : '')} />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </section>
        ))}
      </nav>
    </aside>
  )
}
