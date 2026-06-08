import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { cn } from '@/lib/utils'
import {
  Lightbulb, FolderKanban, CheckSquare, Users, Handshake, Bot,
  FileText, Building2, Plus, ArrowRight, Clock
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface Row {
  id: string
  status: string
  name?: string
  title?: string
  company?: string | null
  created_at?: string
  due_date?: string | null
}

interface AppRow {
  id: string
  name: string
  status: string
  next_action?: string | null
  live_url?: string | null
  vercel_url?: string | null
  github_url?: string | null
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const OPEN_TASK = (s: string) => !['done', 'cancelled'].includes(s)

export default async function ControlRoomPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user?.id || '')
    .single()

  const [ideasRes, projectsRes, tasksRes, leadsRes, partnersRes, proposalsRes, customersRes, appsRes] =
    await Promise.all([
      supabase.from('ideas').select('id, status'),
      supabase.from('projects').select('id, title, status, created_at'),
      supabase.from('tasks').select('id, title, status, due_date'),
      supabase.from('leads').select('id, name, company, status, created_at'),
      supabase.from('partners').select('id, name, company, status, created_at'),
      supabase.from('proposals').select('id, status'),
      supabase.from('customers').select('id, status'),
      supabase.from('ai_workspace_apps')
        .select('id, name, status, next_action, live_url, vercel_url, github_url')
        .order('updated_at', { ascending: false })
        .limit(8),
    ])

  const ideas = (ideasRes.data ?? []) as Row[]
  const projects = (projectsRes.data ?? []) as Row[]
  const tasks = (tasksRes.data ?? []) as Row[]
  const leads = (leadsRes.data ?? []) as Row[]
  const partners = (partnersRes.data ?? []) as Row[]
  const proposals = (proposalsRes.data ?? []) as Row[]
  const customers = (customersRes.data ?? []) as Row[]
  const apps = (appsRes.data ?? []) as AppRow[]

  const count = (rows: Row[], status: string) => rows.filter(r => r.status === status).length

  const modules: {
    label: string
    icon: LucideIcon
    total: number
    activeLabel?: string
    description: string
    href: string
  }[] = [
    { label: 'Ideas', icon: Lightbulb, total: ideas.length, activeLabel: `${count(ideas, 'under_review')} under review`, description: 'Capture, review, and convert ideas into projects.', href: '/internal/ideas' },
    { label: 'Projects', icon: FolderKanban, total: projects.length, activeLabel: `${count(projects, 'active')} active`, description: 'Plan and deliver client and internal builds.', href: '/internal/projects' },
    { label: 'Tasks', icon: CheckSquare, total: tasks.length, activeLabel: `${tasks.filter(t => OPEN_TASK(t.status)).length} open`, description: 'Track execution across every project.', href: '/internal/tasks' },
    { label: 'Leads', icon: Users, total: leads.length, activeLabel: `${count(leads, 'new')} new`, description: 'Inbound and outbound sales pipeline.', href: '/internal/leads' },
    { label: 'Partners', icon: Handshake, total: partners.length, activeLabel: `${count(partners, 'new_application')} new applications`, description: 'Referral and implementation partners.', href: '/internal/partners' },
    { label: 'AI Workspace', icon: Bot, total: apps.length, activeLabel: `${count(apps as unknown as Row[], 'deployed')} deployed`, description: 'Apps, products, and experiments we build.', href: '/internal/ai-workspace' },
    { label: 'Proposals', icon: FileText, total: proposals.length, activeLabel: `${count(proposals, 'sent')} sent`, description: 'Proposals sent to leads and customers.', href: '/internal/proposals' },
    { label: 'Customers', icon: Building2, total: customers.length, activeLabel: `${count(customers, 'active')} active`, description: 'Active customer accounts.', href: '/internal/customers' },
  ]

  const quickActions: { label: string; href: string; icon: LucideIcon }[] = [
    { label: 'Add Idea', href: '/internal/ideas/new', icon: Lightbulb },
    { label: 'Add Lead', href: '/internal/leads/new', icon: Users },
    { label: 'Add Partner', href: '/internal/partners/new', icon: Handshake },
    { label: 'Create Project', href: '/internal/projects/new', icon: FolderKanban },
    { label: 'Add AI Workspace App', href: '/internal/ai-workspace/new', icon: Bot },
    { label: 'View Tasks', href: '/internal/tasks', icon: CheckSquare },
  ]

  const byCreatedDesc = (a: Row, b: Row) => ((a.created_at ?? '') < (b.created_at ?? '') ? 1 : -1)
  const recentLeads = [...leads].sort(byCreatedDesc).slice(0, 5)
  const recentPartners = [...partners].sort(byCreatedDesc).slice(0, 5)
  const recentProjects = [...projects].sort(byCreatedDesc).slice(0, 5)
  const tasksDueSoon = tasks
    .filter(t => t.due_date && OPEN_TASK(t.status))
    .sort((a, b) => ((a.due_date ?? '') < (b.due_date ?? '') ? -1 : 1))
    .slice(0, 5)

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'there'
  const role = profile?.role ?? 'employee'

  return (
    <div className="space-y-8 selection:bg-zo-purple/20">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Control Room</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back, {displayName}</p>
        </div>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map(m => (
          <Card key={m.label} className="group bg-card border-border transition-all hover:border-zo-purple/40">
            <CardContent className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between">
                <m.icon className="h-5 w-5 text-zo-purple opacity-80 transition-opacity group-hover:opacity-100" />
                <span className="text-2xl font-bold text-zo-chrome">{m.total}</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-zo-chrome">{m.label}</p>
              {m.activeLabel && (
                <p className="mt-0.5 text-[11px] font-medium text-zo-purple-2">{m.total} total · {m.activeLabel}</p>
              )}
              <p className="mt-2 flex-1 text-xs leading-relaxed text-zo-muted">{m.description}</p>
              <Link
                href={m.href}
                className="mt-4 flex items-center text-[11px] font-bold uppercase tracking-wider text-zo-muted transition-colors hover:text-zo-purple"
              >
                Open {m.label} <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: AI Workspace snapshot + recent projects/tasks */}
        <div className="space-y-6 lg:col-span-2">
          {/* AI Workspace snapshot */}
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-zo-purple" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider">AI Workspace Snapshot</CardTitle>
              </div>
              <Link href="/internal/ai-workspace" className="flex items-center text-[10px] text-zo-muted hover:text-zo-purple">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {apps.length > 0 ? (
                <div className="space-y-1">
                  {apps.map(app => {
                    const url = app.live_url || app.vercel_url || app.github_url
                    return (
                      <Link
                        key={app.id}
                        href={`/internal/ai-workspace/${app.id}`}
                        className="group/app flex items-center justify-between gap-3 rounded p-3 transition-colors hover:bg-white/5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zo-purple group-hover/app:animate-pulse" />
                          <span className="truncate text-sm font-medium text-zo-chrome">{app.name}</span>
                          <ResourceStatusBadge status={app.status} />
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="hidden truncate text-[10px] italic text-zo-dim md:block md:max-w-[180px]">
                            {app.next_action || 'No next action'}
                          </span>
                          {url && <span className="text-[9px] font-bold uppercase tracking-tighter text-zo-purple-2">Link</span>}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs text-zo-muted">No AI Workspace apps registered yet.</p>
                  <Link
                    href="/internal/ai-workspace/new"
                    className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-4 inline-flex items-center')}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Create AI Workspace module
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent projects + tasks due soon */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <RecentList
              title="Recent Projects"
              icon={FolderKanban}
              items={recentProjects.map(p => ({ id: p.id, primary: p.title ?? 'Untitled', status: p.status, meta: formatDate(p.created_at) }))}
              emptyText="No projects yet."
            />
            <RecentList
              title="Tasks Due Soon"
              icon={Clock}
              items={tasksDueSoon.map(t => ({ id: t.id, primary: t.title ?? 'Untitled', status: t.status, meta: formatDate(t.due_date) }))}
              emptyText="No upcoming tasks."
            />
          </div>
        </div>

        {/* Right: quick actions + recent leads + recent partners */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {quickActions.map(a => (
                <Link
                  key={a.label}
                  href={a.href}
                  className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'group/qa h-10 w-full justify-start text-xs')}
                >
                  <a.icon className="mr-3 h-3 w-3 text-zo-purple opacity-70 group-hover/qa:opacity-100" /> {a.label}
                </Link>
              ))}
            </CardContent>
          </Card>

          <RecentList
            title="Recent Leads"
            icon={Users}
            items={recentLeads.map(l => ({ id: l.id, primary: l.name ?? 'Unknown', status: l.status, meta: l.company || formatDate(l.created_at), href: `/internal/leads/${l.id}` }))}
            emptyText="No leads yet."
          />

          <RecentList
            title="Recent Partner Applications"
            icon={Handshake}
            items={recentPartners.map(p => ({ id: p.id, primary: p.name ?? 'Unknown', status: p.status, meta: p.company || formatDate(p.created_at), href: `/internal/partners/${p.id}` }))}
            emptyText="No partner applications yet."
          />
        </div>
      </div>
    </div>
  )
}

interface RecentItem {
  id: string
  primary: string
  status: string
  meta: string
  href?: string
}

function RecentList({
  title,
  icon: Icon,
  items,
  emptyText,
}: {
  title: string
  icon: LucideIcon
  items: RecentItem[]
  emptyText: string
}) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border/50 pb-4">
        <Icon className="h-4 w-4 text-zo-purple" />
        <CardTitle className="text-sm font-bold uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {items.length > 0 ? (
          <div className="space-y-1">
            {items.map(item => {
              const inner = (
                <>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-zo-chrome">{item.primary}</span>
                    <span className="truncate text-[10px] text-zo-dim">{item.meta}</span>
                  </div>
                  <ResourceStatusBadge status={item.status} />
                </>
              )
              return item.href ? (
                <Link key={item.id} href={item.href} className="flex items-center justify-between gap-3 rounded p-2.5 transition-colors hover:bg-white/5">
                  {inner}
                </Link>
              ) : (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded p-2.5">
                  {inner}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-zo-muted">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  )
}
