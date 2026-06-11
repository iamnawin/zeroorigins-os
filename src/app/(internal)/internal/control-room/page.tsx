import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { cn } from '@/lib/utils'
import {
  FolderKanban, CheckSquare, Users, Bot, Plus, ArrowRight
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

function KPICard({ 
  icon: Icon, 
  label, 
  count, 
  status, 
  description, 
  href,
  accent = 'purple' 
}: {
  icon: LucideIcon
  label: string
  count: number
  status: string
  description: string
  href: string
  accent?: 'purple' | 'blue' | 'green' | 'orange'
}) {
  const accentColors = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 group-hover:border-purple-500/40',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 group-hover:border-blue-500/40',
    green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 group-hover:border-emerald-500/40',
    orange: 'from-amber-500/20 to-amber-600/10 border-amber-500/20 group-hover:border-amber-500/40'
  }

  const iconColors = {
    purple: 'text-purple-400 group-hover:text-purple-300',
    blue: 'text-blue-400 group-hover:text-blue-300',
    green: 'text-emerald-400 group-hover:text-emerald-300',
    orange: 'text-amber-400 group-hover:text-amber-300'
  }

  return (
    <Link 
      href={href}
      className={cn(
        "group relative overflow-hidden zo-surface-elevated hover:zo-glass zo-motion-safe block p-6 rounded-xl border",
        accentColors[accent]
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 zo-motion-safe">
        <div className="absolute top-4 right-4">
          <Icon className="w-12 h-12 text-white" />
        </div>
      </div>
      
      {/* Accent line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-60 group-hover:opacity-100 zo-motion-safe",
        iconColors[accent]
      )} />

      <div className="relative z-10 space-y-4">
        {/* Icon and count */}
        <div className="flex items-start justify-between">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center zo-motion-safe",
            accent === 'purple' ? 'bg-purple-500/10 group-hover:bg-purple-500/15' :
            accent === 'blue' ? 'bg-blue-500/10 group-hover:bg-blue-500/15' :
            accent === 'green' ? 'bg-emerald-500/10 group-hover:bg-emerald-500/15' :
            'bg-amber-500/10 group-hover:bg-amber-500/15'
          )}>
            <Icon className={cn("w-5 h-5 zo-motion-safe", iconColors[accent])} />
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white tabular-nums">{count}</div>
            <div className={cn("text-sm font-medium", iconColors[accent])}>{status}</div>
          </div>
        </div>

        {/* Label and description */}
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">{label}</h3>
          <p className="text-sm text-white/60 leading-relaxed">{description}</p>
        </div>

        {/* Hover indicator */}
        <div className="flex items-center text-white/40 group-hover:text-white/60 zo-motion-safe">
          <span className="text-xs font-medium">View details</span>
          <ArrowRight className="ml-1 w-3 h-3 group-hover:translate-x-0.5 zo-motion-safe" />
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  actionHref 
}: {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="py-12 text-center space-y-4">
      <div className="w-12 h-12 mx-auto bg-white/5 rounded-xl flex items-center justify-center">
        <Icon className="w-6 h-6 text-white/40" />
      </div>
      <div className="space-y-2">
        <h3 className="font-medium text-white/80">{title}</h3>
        <p className="text-sm text-white/50 max-w-sm mx-auto leading-relaxed">{description}</p>
      </div>
      {actionLabel && actionHref && (
        <Link 
          href={actionHref}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-300 hover:text-purple-200 zo-motion-safe"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Link>
      )}
    </div>
  )
}

function RecentItem({ 
  href, 
  title, 
  subtitle, 
  status 
}: {
  href: string
  title: string
  subtitle: string
  status: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg zo-motion-safe group"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white/90 truncate">{title}</div>
        <div className="text-xs text-white/50 truncate">{subtitle}</div>
      </div>
      <div className="flex items-center gap-3">
        <ResourceStatusBadge status={status} />
        <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 zo-motion-safe" />
      </div>
    </Link>
  )
}

export default async function ControlRoomPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user?.id || '')
    .single()

  const [projectsRes, tasksRes, leadsRes, appsRes] =
    await Promise.all([
      supabase.from('projects').select('id, title, status, created_at'),
      supabase.from('tasks').select('id, title, status, due_date, assigned_to'),
      supabase.from('leads').select('id, name, company, status, created_at, automation_status'),
      supabase.from('ai_workspace_apps')
        .select('id, name, status, next_action, live_url, vercel_url, github_url')
        .order('updated_at', { ascending: false })
        .limit(8),
    ])

  const projects = (projectsRes.data ?? []) as Row[]
  const tasks = (tasksRes.data ?? []) as Row[]
  const leads = (leadsRes.data ?? []) as Row[]
  const apps = (appsRes.data ?? []) as AppRow[]

  const count = (rows: Row[], status: string) => rows.filter(r => r.status === status).length

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'there'
  const role = (profile?.role ?? 'employee') as string

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })

  const byCreatedDesc = (a: Row, b: Row) => ((a.created_at ?? '') < (b.created_at ?? '') ? 1 : -1)
  const recentLeads = [...leads].sort(byCreatedDesc).slice(0, 4)
  const recentProjects = [...projects].sort(byCreatedDesc).slice(0, 4)
  const recentApps = apps.slice(0, 4)

  return (
    <div className="max-w-7xl mx-auto space-y-12 p-6">
      {/* Command Hero Panel */}
      <div className="relative overflow-hidden zo-glass-elevated rounded-2xl border-white/10">
        {/* Background pattern */}
        <div className="absolute inset-0 zo-grid-pattern opacity-10" />
        
        <div className="relative z-10 p-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            {/* Status Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold text-white">Control Room</h1>
                <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300">{role}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-xl text-white/80">Welcome back, {displayName}</p>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    </div>
                    <span>Workspace online</span>
                  </div>
                  <span>•</span>
                  <span>{today}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Link href="/internal/leads/new" className="zo-button-primary h-12 px-6 flex items-center gap-2 font-semibold text-white">
                <Plus className="w-4 h-4" />
                New Lead
              </Link>
              <Link href="/internal/projects/new" className="h-12 px-6 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl flex items-center gap-2 font-semibold text-white zo-motion-safe">
                <FolderKanban className="w-4 h-4" />
                New Project
              </Link>
              <Link href="/internal/tasks" className="h-12 px-6 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl flex items-center gap-2 font-semibold text-white zo-motion-safe">
                <CheckSquare className="w-4 h-4" />
                View Tasks
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={Users}
          label="Leads"
          count={leads.filter(l => OPEN_LEAD(l.status)).length}
          status={`${count(leads, 'new')} new`}
          description="Open sales pipeline"
          href="/internal/leads"
          accent="purple"
        />
        <KPICard
          icon={FolderKanban}
          label="Projects"
          count={count(projects, 'active')}
          status={`${projects.length} total`}
          description="Builds in delivery"
          href="/internal/projects"
          accent="blue"
        />
        <KPICard
          icon={CheckSquare}
          label="Tasks"
          count={tasks.filter(t => OPEN_TASK(t.status)).length}
          status={`${count(tasks, 'in_progress')} in progress`}
          description="Execution queue"
          href="/internal/tasks"
          accent="green"
        />
        <KPICard
          icon={Bot}
          label="AI Workspace"
          count={apps.length}
          status={`${count(apps as unknown as Row[], 'deployed')} deployed`}
          description="Apps and experiments"
          href="/internal/ai-workspace"
          accent="orange"
        />
      </div>

      {/* Main Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Leads */}
        <Card className="zo-glass border-white/10 col-span-1">
          <CardHeader className="border-b border-white/10 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <CardTitle className="text-white">Recent Leads</CardTitle>
              </div>
              <Link href="/internal/leads" className="text-xs text-purple-300 hover:text-purple-200 zo-motion-safe">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentLeads.length > 0 ? (
              <div className="divide-y divide-white/5">
                {recentLeads.map(lead => (
                  <RecentItem
                    key={lead.id}
                    href={`/internal/leads/${lead.id}`}
                    title={lead.name ?? 'Unknown'}
                    subtitle={lead.company || formatDate(lead.created_at)}
                    status={lead.status}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No leads yet"
                description="Capture your first build request or create one manually."
                actionLabel="Add Lead"
                actionHref="/internal/leads/new"
              />
            )}
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card className="zo-glass border-white/10 col-span-1">
          <CardHeader className="border-b border-white/10 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <FolderKanban className="w-4 h-4 text-blue-400" />
                </div>
                <CardTitle className="text-white">Recent Projects</CardTitle>
              </div>
              <Link href="/internal/projects" className="text-xs text-blue-300 hover:text-blue-200 zo-motion-safe">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentProjects.length > 0 ? (
              <div className="divide-y divide-white/5">
                {recentProjects.map(project => (
                  <RecentItem
                    key={project.id}
                    href={`/internal/projects/${project.id}`}
                    title={project.title ?? 'Untitled'}
                    subtitle={formatDate(project.created_at)}
                    status={project.status}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FolderKanban}
                title="No active projects yet"
                description="Create one from a won lead or start a new project."
                actionLabel="Create Project"
                actionHref="/internal/projects/new"
              />
            )}
          </CardContent>
        </Card>

        {/* AI Workspace */}
        <Card className="zo-glass border-white/10 col-span-1">
          <CardHeader className="border-b border-white/10 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-orange-400" />
                </div>
                <CardTitle className="text-white">AI Workspace</CardTitle>
              </div>
              <Link href="/internal/ai-workspace" className="text-xs text-orange-300 hover:text-orange-200 zo-motion-safe">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentApps.length > 0 ? (
              <div className="divide-y divide-white/5">
                {recentApps.map(app => (
                  <RecentItem
                    key={app.id}
                    href={`/internal/ai-workspace/${app.id}`}
                    title={app.name}
                    subtitle={app.next_action || 'No next action'}
                    status={app.status}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Bot}
                title="No apps yet"
                description="Create your first AI workspace app to get started."
                actionLabel="Add App"
                actionHref="/internal/ai-workspace/new"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
