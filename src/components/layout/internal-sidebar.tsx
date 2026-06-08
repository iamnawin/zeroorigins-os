'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import {
  LayoutDashboard, Lightbulb, FolderKanban, CheckSquare,
  Users, Building2, Handshake, FileText, HardDrive, Palette,
  DollarSign, BookOpen, Settings, Bot
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Role } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  built: boolean
  roles?: Role[]
}

const navItems: NavItem[] = [
  { label: 'Control Room', href: '/internal/control-room', icon: LayoutDashboard, built: true },
  { label: 'Ideas', href: '/internal/ideas', icon: Lightbulb, built: true },
  { label: 'Projects', href: '/internal/projects', icon: FolderKanban, built: true },
  { label: 'Tasks', href: '/internal/tasks', icon: CheckSquare, built: true },
  { label: 'Leads', href: '/internal/leads', icon: Users, built: true },
  { label: 'Partners', href: '/internal/partners', icon: Handshake, built: true },
  { label: 'AI Workspace', href: '/internal/ai-workspace', icon: Bot, built: true },
  { label: 'Proposals', href: '/internal/proposals', icon: FileText, built: false },
  { label: 'Customers', href: '/internal/customers', icon: Building2, built: false },
  { label: 'Assets', href: '/internal/assets', icon: HardDrive, built: false },
  { label: 'Content Studio', href: '/internal/content-studio', icon: Palette, built: false },
  { label: 'Finance', href: '/internal/finance', icon: DollarSign, built: false, roles: ['SUPER_ADMIN', 'FOUNDER'] },
  { label: 'Knowledge', href: '/internal/knowledge', icon: BookOpen, built: false },
  { label: 'Settings', href: '/internal/settings', icon: Settings, built: false, roles: ['SUPER_ADMIN', 'FOUNDER'] },
]

export function InternalSidebar({ role }: { role?: Role }) {
  const pathname = usePathname()
  const visibleItems = navItems.filter(item => !item.roles || (role && item.roles.includes(role)))

  return (
    <aside className="w-60 h-screen fixed left-0 top-0 border-r border-border bg-zo-black-2 flex flex-col selection:bg-zo-purple/20">
      <div className="p-5 border-b border-border flex items-center gap-3">
        <div className="relative w-8 h-8 shrink-0">
          <Image src="/logo.png" alt="Logo" fill className="object-contain animate-pulse-slow" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider text-zo-chrome">ZEROORIGINS</h1>
          <p className="text-[9px] text-zo-purple-2 tracking-[0.2em] uppercase font-bold mt-0.5">Internal Workspace</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {visibleItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-6 py-2.5 text-sm transition-all relative',
                isActive && 'text-zo-purple-2 bg-zo-purple/5 border-r-2 border-zo-purple shadow-[inset_-4px_0_12px_rgba(139,92,246,0.05)] font-medium',
                !isActive && 'text-zo-muted hover:text-zo-chrome hover:bg-white/5'
              )}
            >
              <item.icon className={cn('w-4 h-4', isActive ? 'text-zo-purple' : 'text-current opacity-70')} />
              <span>{item.label}</span>
              {!item.built && <span className="ml-auto text-[8px] uppercase tracking-tighter opacity-30 font-bold bg-white/5 px-1 rounded">Soon</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
