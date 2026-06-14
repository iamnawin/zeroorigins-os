import type { Role } from '@/types'

export type InternalNavGroupId = 'primary' | 'business' | 'execution' | 'system' | 'settings'

export interface InternalNavItem {
  label: string
  href: string
  icon: string
  roles?: Role[]
}

export interface InternalNavGroup {
  id: InternalNavGroupId
  label: string
  items: InternalNavItem[]
}

export const INTERNAL_NAV_GROUPS: InternalNavGroup[] = [
  {
    id: 'primary',
    label: 'Primary',
    items: [
      { label: 'Control Room', href: '/internal/control-room', icon: 'LayoutDashboard' },
      { label: 'AI Workspace', href: '/internal/ai-workspace', icon: 'Bot' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    items: [
      { label: 'Leads', href: '/internal/leads', icon: 'Users' },
      { label: 'Deals', href: '/internal/deals', icon: 'DollarSign' },
      { label: 'Proposals', href: '/internal/proposals', icon: 'FileText' },
      { label: 'Customers', href: '/internal/customers', icon: 'Building2' },
      { label: 'Partners', href: '/internal/partners', icon: 'Handshake' },
    ],
  },
  {
    id: 'execution',
    label: 'Execution',
    items: [
      { label: 'Projects', href: '/internal/projects', icon: 'FolderKanban' },
      { label: 'Tasks', href: '/internal/tasks', icon: 'CheckSquare' },
      { label: 'Meetings', href: '/internal/meetings', icon: 'CalendarDays' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { label: 'Applications', href: '/internal/applications', icon: 'AppWindow' },
      { label: 'Business Verticals', href: '/internal/business-verticals', icon: 'PanelsTopLeft' },
      { label: 'Ideas Vault', href: '/internal/ideas', icon: 'Lightbulb' },
      { label: 'Automation', href: '/internal/automation', icon: 'Workflow' },
      { label: 'Finance', href: '/internal/finance', icon: 'WalletCards', roles: ['admin'] },
      { label: 'Knowledge', href: '/internal/knowledge', icon: 'BookOpen' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      { label: 'Settings', href: '/internal/settings', icon: 'Settings', roles: ['admin'] },
    ],
  },
]

export function filterInternalNavGroups(role?: Role) {
  return INTERNAL_NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => !item.roles || (role && item.roles.includes(role))),
  })).filter(group => group.items.length > 0)
}
