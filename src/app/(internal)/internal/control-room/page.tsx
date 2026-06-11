import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { cn } from '@/lib/utils'
import {
  Lightbulb, FolderKanban, CheckSquare, Users, Handshake, Bot,
  FileText, Building2, Plus, ArrowRight, Clock, Workflow, ClipboardList
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
  assigned_to?: string | null
  automation_status?: string | null
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
const OPEN_LEAD = (s: string) => !['lost', 'archived'].includes(s)

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
      supabase.from('tasks').select('id, title, status, due_date, assigned_to'),
      supabase.from('leads').select('id, name, company, status, created_at, automation_status'),
      supabase.from('partners').select('id, name, company, status, created_at, automation_status'),
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

  const kpis: {
    label: string
    icon: LucideIcon
    total: number
    subLabel: string
    description: string
    href: string
  }[] = [
    { label: 'Leads', icon: Users, total: leads.filter(l => OPEN_LEAD(l.status)).length, subLabel: `${count(leads, 'new')} new`, description: 'Open sales pipeline', href: '/internal/leads' },
    { label: 'Projects', icon: FolderKanban, total: count(projects, 'active'), subLabel: `${projects.length} total`, description: 'Active builds in delivery', href: '/internal/projects' },
    { label: 'Tasks', icon: CheckSquare, total: tasks.filter(t => OPEN_TASK(t.status)).length, subLabel: `${count(tasks, 'in_progress')} in progress`, description: 'Pending execution items', href: '/internal/tasks' },
    { label: 'Partners', icon: Handshake, total: count(partners, 'new_application'), subLabel: `${partners.length} total`, description: 'New partner requests', href: '/internal/partners' },
    { label: 'Customers', icon: Building2, total: count(customers, 'active'), subLabel: `${customers.length} total`, description: 'Active customer accounts', href: '/internal/customers' },
    { label: 'Ideas', icon: Lightbulb, total: ideas.length, subLabel: `${count(ideas, 'under_review')} under review`, description: 'Concepts in the funnel', href: '/internal/ideas' },
    { label: 'AI Workspace', icon: Bot, total: apps.length, subLabel: `${count(apps as unknown as Row[], 'deployed')} deployed`, description: 'Apps and experiments', href: '/internal/ai-workspace' },
    { label: 'Proposals', icon: FileText, total: proposals.length, subLabel: `${count(proposals, 'sent')} sent`, description: 'Sent to leads and customers', href: '/internal/proposals' },
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
  const activeProjects = projects.filter(p => p.status === 'active').sort(byCreatedDesc).slice(0, 5)
  const tasksDueSoon = tasks
    .filter(t => t.due_date && OPEN_TASK(t.status))
    .sort((a, b) => ((a.due_date ?? '') < (b.due_date ?? '') ? -1 : 1))
    .slice(0, 5)

  const leadsQueued = leads.filter(l => l.automation_status === 'not_started').length
  const partnersQueued = partners.filter(p => p.automation_status === 'not_started').length

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'there'
  const role = (profile?.role ?? 'employee') as string
  const isAdmin = role === 'admin'
  const myTasks = tasks.filter(t => t.assigned_to === user?.id && OPEN_TASK(t.status)).slice(0, 5)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata',
  })

  return (
    <div className="space-y-8 selection:bg-zo-purple/20">
      {/* Hero / status band */}
      <section className="relative overflow-hidden rounded-xl border border-border bg-card p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 50% 90% at 85% 0%, rgba(139, 92, 246, 0.12), transparent 65%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(139,92,246,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.7) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-zo-chrome">
                {isAdmin ? 'Control Room' : 'My Workspace'}
              </h1>
              <span className="inline-flex items-center rounded-full bg-zo-purple/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zo-purple dark:bg-zo-purple/15">
                {role}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Welcome back, {displayName}</p>
            <div className="mt-3 flex items-center gap-3 text-[11px] text-zo-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Workspace online
              </span>
              <span className="text-zo-dim">·</span>
              <span>{today}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/internal/leads/new" className={cn(buttonVariants(), 'font-semibold')}>
              <Plus className="h-3.5 w-3.5" /> New Lead
            </Link>
            <Link href="/internal/projects/new" className={cn(buttonVariants({ variant: 'secondary' }), 'font-semibold')}>
              <Plus className="h-3.5 w-3.5" /> New Project
            </Link>
            <Link href="/internal/tasks" className={cn(buttonVariants({ variant: 'secondary' }), 'font-semibold')}>
              <CheckSquare className="h-3.5 w-3.5" /> View Tasks
            </Link>
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(k => (
          <Link
            key={k.label}
            href={k.href}
            className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-zo-purple/40 hover:shadow-lg hover:shadow-zo-purple/5 active:translate-y-px"
          >
            <div className="flex items-start justify-between">
              <k.icon className="h-4 w-4 text-zo-purple opacity-80 transition-opacity group-hover:opacity-100" />
              <span className="text-2xl font-bold tabular-nums text-zo-chrome">{k.total}</span>
            </div>
            <p className="mt-2.5 text-sm font-semibold text-zo-chrome">{k.label}</p>
            <p className="mt-0.5 text-[11px] font-medium text-zo-purple-2">{k.subLabel}</p>
            <p className="mt-1 hidden text-xs text-zo-muted sm:block">{k.description}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {!isAdmin && (
            <SectionCard title="My Tasks" icon={ClipboardList}>
              {myTasks.length > 0 ? (
                <RowList
                  items={myTasks.map(t => ({ id: t.id, primary: t.title ?? 'Untitled', status: t.status, meta: t.due_date ? `Due ${formatDate(t.due_date)}` : 'No due date', href: `/internal/tasks/${t.id}` }))}
                />
              ) : (
                <p className="py-6 text-center text-xs text-zo-muted">
                  Assigned work will appear here once Admin assigns records.
                </p>
              )}
            </SectionCard>
          )}

          <SectionCard title="Recent Leads" icon={Users} viewAllHref="/internal/leads">
            {recentLeads.length > 0 ? (
              <RowList
                items={recentLeads.map(l => ({ id: l.id, primary: l.name ?? 'Unknown', status: l.status, meta: l.company || formatDate(l.created_at), href: `/internal/leads/${l.id}` }))}
              />
            ) : (
              <EmptyHint text="No leads yet." ctaLabel="Add your first lead" ctaHref="/internal/leads/new" />
            )}
          </SectionCard>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <SectionCard title="Active Projects" icon={FolderKanban} viewAllHref="/internal/projects">
              {activeProjects.length > 0 ? (
                <RowList
                  items={activeProjects.map(p => ({ id: p.id, primary: p.title ?? 'Untitled', status: p.status, meta: formatDate(p.created_at), href: `/internal/projects/${p.id}` }))}
                />
              ) : (
                <EmptyHint text="No active projects yet. Create one from a won lead." ctaLabel="Create project" ctaHref="/internal/projects/new" />
              )}
            </SectionCard>
            <SectionCard title="Tasks Due Soon" icon={Clock} viewAllHref="/internal/tasks">
              {tasksDueSoon.length > 0 ? (
                <RowList
                  items={tasksDueSoon.map(t => ({ id: t.id, primary: t.title ?? 'Untitled', status: t.status, meta: formatDate(t.due_date), href: `/internal/tasks/${t.id}` }))}
                />
              ) : (
                <p className="py-6 text-center text-xs text-zo-muted">No upcoming tasks.</p>
              )}
            </SectionCard>
          </div>

          <SectionCard title="AI Workspace Snapshot" icon={Bot} viewAllHref="/internal/ai-workspace">
            {apps.length > 0 ? (
              <div className="space-y-1">
                {apps.map(app => {
                  const url = app.live_url || app.vercel_url || app.github_url
                  return (
                    <Link
                      key={app.id}
                      href={`/internal/ai-workspace/${app.id}`}
                      className="group/app flex items-center justify-between gap-3 rounded p-3 transition-colors hover:bg-zo-purple/5 dark:hover:bg-white/5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zo-purple" />
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
              <EmptyHint text="No AI Workspace apps registered yet." ctaLabel="Create AI Workspace module" ctaHref="/internal/ai-workspace/new" />
            )}
          </SectionCard>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <SectionCard title="Automation Queue" icon={Workflow}>
            {leadsQueued + partnersQueued > 0 ? (
              <div className="space-y-1">
                <Link href="/internal/leads" className="flex items-center justify-between gap-3 rounded p-2.5 transition-colors hover:bg-zo-purple/5 dark:hover:bg-white/5">
                  <span className="text-sm text-zo-silver">Leads awaiting automation</span>
                  <span className="text-sm font-bold tabular-nums text-zo-purple-2">{leadsQueued}</span>
                </Link>
                <Link href="/internal/partners" className="flex items-center justify-between gap-3 rounded p-2.5 transition-colors hover:bg-zo-purple/5 dark:hover:bg-white/5">
                  <span className="text-sm text-zo-silver">Partner requests awaiting automation</span>
                  <span className="text-sm font-bold tabular-nums text-zo-purple-2">{partnersQueued}</span>
                </Link>
                <p className="px-2.5 pt-2 text-[10px] leading-relaxed text-zo-dim">
                  n8n workflows pick up records marked <span className="font-mono">not_started</span>.
                </p>
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-zo-muted">No automation events yet.</p>
            )}
          </SectionCard>

          <SectionCard title="Recent Partner Requests" icon={Handshake} viewAllHref="/internal/partners">
            {recentPartners.length > 0 ? (
              <RowList
                items={recentPartners.map(p => ({ id: p.id, primary: p.name ?? 'Unknown', status: p.status, meta: p.company || formatDate(p.created_at), href: `/internal/partners/${p.id}` }))}
              />
            ) : (
              <p className="py-6 text-center text-xs text-zo-muted">No partner requests yet.</p>
            )}
          </SectionCard>

          <SectionCard title="Quick Actions" icon={Plus}>
            <div className="space-y-2">
              {quickActions.map(a => (
                <Link
                  key={a.label}
                  href={a.href}
                  className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'group/qa h-10 w-full justify-start text-xs')}
                >
                  <a.icon className="mr-3 h-3 w-3 text-zo-purple opacity-70 group-hover/qa:opacity-100" /> {a.label}
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  viewAllHref,
  children,
}: {
  title: string
  icon: LucideIcon
  viewAllHref?: string
  children: React.ReactNode
}) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-zo-purple" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider">{title}</CardTitle>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="flex items-center text-[10px] text-zo-muted transition-colors hover:text-zo-purple">
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  )
}

interface RowItem {
  id: string
  primary: string
  status: string
  meta: string
  href: string
}

function RowList({ items }: { items: RowItem[] }) {
  return (
    <div className="space-y-1">
      {items.map(item => (
        <Link
          key={item.id}
          href={item.href}
          className="flex items-center justify-between gap-3 rounded p-2.5 transition-colors hover:bg-zo-purple/5 dark:hover:bg-white/5"
        >
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-zo-chrome">{item.primary}</span>
            <span className="truncate text-[10px] text-zo-dim">{item.meta}</span>
          </div>
          <ResourceStatusBadge status={item.status} />
        </Link>
      ))}
    </div>
  )
}

function EmptyHint({ text, ctaLabel, ctaHref }: { text: string; ctaLabel: string; ctaHref: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-xs text-zo-muted">{text}</p>
      <Link
        href={ctaHref}
        className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-4 inline-flex items-center')}
      >
        <Plus className="mr-1 h-3 w-3" /> {ctaLabel}
      </Link>
    </div>
  )
}
