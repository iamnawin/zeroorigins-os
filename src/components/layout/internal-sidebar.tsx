'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import {
  LayoutDashboard, Lightbulb, GitBranch, FolderKanban, CheckSquare,
  Users, Building2, Handshake, FileText, HardDrive, Palette,
  DollarSign, BookOpen, Settings, Bot, Share2
} from 'lucide-react'

const navItems = [
  { label: 'Control Room', href: '/internal/control-room', icon: LayoutDashboard, active: true },
  { label: 'AI Workspace', href: '/internal/ai-workspace', icon: Bot, active: true },
  { label: 'Ideas', href: '/internal/ideas', icon: Lightbulb, active: true },
  { label: 'Decisions', href: '/internal/decisions', icon: GitBranch, active: false },
  { label: 'Projects', href: '/internal/projects', icon: FolderKanban, active: true },
  { label: 'Tasks', href: '/internal/tasks', icon: CheckSquare, active: true },
  { label: 'Leads', href: '/internal/leads', icon: Users, active: true },
  { label: 'Customers', href: '/internal/customers', icon: Building2, active: false },
  { label: 'Partners', href: '/internal/partners', icon: Handshake, active: true },
  { label: 'Referrals', href: '/internal/referrals', icon: Share2, active: false },
  { label: 'Proposals', href: '/internal/proposals', icon: FileText, active: false },
  { label: 'Assets', href: '/internal/assets', icon: HardDrive, active: false },
  { label: 'Content Studio', href: '/internal/content-studio', icon: Palette, active: false },
  { label: 'Finance', href: '/internal/finance', icon: DollarSign, active: false },
  { label: 'Knowledge', href: '/internal/knowledge', icon: BookOpen, active: false },
  { label: 'AI Agents', href: '/internal/ai-agents', icon: Bot, active: false },
  { label: 'Settings', href: '/internal/settings', icon: Settings, active: false },
]

export function InternalSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 h-screen fixed left-0 top-0 border-r border-border bg-[#090909] flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="relative w-8 h-8 shrink-0">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider text-zo-chrome">ZEROORIGINS</h1>
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">Control Room</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.active ? item.href : '#'}
              className={cn(
                'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                isActive && 'bg-[rgba(245,166,35,0.08)] text-zo-amber border-r-2 border-zo-amber',
                !isActive && item.active && 'text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.03)]',
                !item.active && 'text-[rgba(255,255,255,0.25)] cursor-not-allowed'
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {!item.active && <span className="ml-auto text-[9px] uppercase tracking-wider opacity-50">soon</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
