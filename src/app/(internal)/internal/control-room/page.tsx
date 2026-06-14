import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare,
  CirclePlus,
  Clock3,
  DollarSign,
  Handshake,
  Lightbulb,
  MailCheck,
  MessageSquareText,
  ReceiptText,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  WalletCards,
  Workflow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AiAssistPanel } from '@/components/ai/AiAssistPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import type {
  AiAssistRequest,
  Customer,
  Deal,
  FinanceTransaction,
  Lead,
  Meeting,
  Partner,
  Project,
  Proposal,
  Task,
} from '@/types'

const defaultCurrency = 'INR'
const agentPrompts = [
  'What needs my attention today?',
  'Which leads need follow-up?',
  'What tasks are blocked?',
  'Summarize partner activity.',
  'What should we do next?',
]

function formatCurrency(value: number, currency = defaultCurrency) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'No date'
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'No time'
}

function plural(count: number, singular: string, pluralLabel = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralLabel}`
}

export default async function ControlRoomPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user?.id || '').single()

  const [
    leadsRes,
    dealsRes,
    proposalsRes,
    meetingsRes,
    tasksRes,
    projectsRes,
    partnersRes,
    customersRes,
    financeRes,
    aiRes,
    knowledgeRes,
  ] = await Promise.all([
    supabase.from('leads').select('*').not('status', 'in', '("lost","archived")').order('created_at', { ascending: false }).limit(20),
    supabase.from('deals').select('*').not('stage', 'in', '("lost")').order('created_at', { ascending: false }).limit(20),
    supabase.from('proposals').select('*').not('status', 'in', '("accepted","rejected","expired")').order('created_at', { ascending: false }).limit(20),
    supabase.from('meetings').select('*').order('scheduled_at', { ascending: true }).limit(20),
    supabase.from('tasks').select('*').not('status', 'in', '("done","cancelled")').order('created_at', { ascending: false }).limit(20),
    supabase.from('projects').select('*').not('status', 'in', '("delivered","cancelled","archived")').order('updated_at', { ascending: true }).limit(20),
    supabase.from('partners').select('*').not('status', 'in', '("rejected","archived")').order('created_at', { ascending: false }).limit(20),
    supabase.from('customers').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(20),
    supabase.from('finance_transactions').select('*').eq('type', 'expense').order('date', { ascending: false }).limit(50),
    supabase.from('ai_assist_requests').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('knowledge_articles').select('id', { count: 'exact', head: true }),
  ])

  const leads = (leadsRes.data ?? []) as Lead[]
  const deals = (dealsRes.data ?? []) as Deal[]
  const proposals = (proposalsRes.data ?? []) as Proposal[]
  const meetings = (meetingsRes.data ?? []) as Meeting[]
  const tasks = (tasksRes.data ?? []) as Task[]
  const projects = (projectsRes.data ?? []) as Project[]
  const partners = (partnersRes.data ?? []) as Partner[]
  const customers = (customersRes.data ?? []) as Customer[]
  const financeRows = (financeRes.data ?? []) as FinanceTransaction[]
  const aiRequests = (aiRes.data ?? []) as AiAssistRequest[]

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const staleProjectDate = new Date(now)
  staleProjectDate.setDate(staleProjectDate.getDate() - 14)
  const staleProjectCutoff = staleProjectDate.toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const todayMeetings = meetings.filter(row => row.scheduled_at?.slice(0, 10) === today)
  const overdueTasks = tasks.filter(row => row.due_date && row.due_date < today)
  const dueTodayTasks = tasks.filter(row => row.due_date === today)
  const blockedTasks = tasks.filter(row => row.status === 'blocked' || row.status === 'waiting')
  const projectsWithoutRecentActivity = projects.filter(row => row.updated_at < staleProjectCutoff)
  const leadsNeedingAction = leads.filter(row => ['new', 'contacted', 'proposal_needed', 'negotiation', 'on_hold'].includes(row.status))
  const newLeads = leads.filter(row => row.status === 'new')
  const qualifiedLeads = leads.filter(row => ['discovery_done', 'proposal_needed', 'proposal_sent', 'negotiation'].includes(row.status))
  const partnerOpportunities = partners.filter(row => ['new_application', 'under_review', 'call_scheduled', 'approved', 'active'].includes(row.status))
  const openProposalValue = proposals.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const openDealValue = deals.reduce((sum, row) => sum + Number(row.estimated_value ?? 0), 0)
  const monthSpend = financeRows
    .filter(row => row.date && row.date >= monthStart && row.date <= monthEnd && row.status !== 'cancelled')
    .reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const upcomingRenewals = financeRows.filter(row => row.next_due_date && row.next_due_date >= today).slice(0, 3)
  const pendingPayments = financeRows.filter(row => ['planned', 'due', 'overdue'].includes(row.status)).length
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'there'
  const totalAttention = overdueTasks.length + blockedTasks.length + leadsNeedingAction.length + todayMeetings.length
  const briefingSummary = totalAttention > 0
    ? `${plural(totalAttention, 'item')} need attention across follow-ups, tasks, meetings, and revenue motion.`
    : 'The workspace is quiet. Use the agent to plan the next growth or delivery move.'

  const suggestedActions = [
    {
      label: overdueTasks.length ? `Clear ${plural(overdueTasks.length, 'overdue task')}` : "Plan today's delivery work",
      href: '/internal/tasks',
      tone: overdueTasks.length ? 'urgent' : 'steady',
    },
    {
      label: leadsNeedingAction.length ? `Follow up ${plural(leadsNeedingAction.length, 'lead')}` : 'Create the next qualified lead',
      href: '/internal/leads',
      tone: leadsNeedingAction.length ? 'revenue' : 'steady',
    },
    {
      label: projectsWithoutRecentActivity.length ? `Refresh ${plural(projectsWithoutRecentActivity.length, 'project')}` : 'Open active projects',
      href: '/internal/projects',
      tone: projectsWithoutRecentActivity.length ? 'attention' : 'steady',
    },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="overflow-hidden rounded-2xl border border-zo-purple/25 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.26),transparent_34%),linear-gradient(135deg,rgba(24,24,27,0.96),rgba(8,8,10,0.98))] p-4 shadow-2xl shadow-black/30 sm:p-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-zo-purple/40 bg-zo-purple/10 text-zo-purple-2">AI Business Briefing</Badge>
              <span className="text-xs text-muted-foreground">{formatDateTime(now.toISOString())}</span>
            </div>
            <div className="max-w-4xl">
              <p className="text-sm font-medium text-zo-purple-2">Welcome back, {displayName}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-normal text-white sm:text-4xl">Here is what needs attention today.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">{briefingSummary}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {suggestedActions.map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-zo-purple/50 hover:bg-zo-purple/10"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suggested action</p>
                  <p className="mt-2 text-sm font-semibold text-white">{action.label}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-zo-purple-2">
                    Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/internal/tasks/new">
                <Button><CirclePlus className="mr-2 h-4 w-4" />Add Task</Button>
              </Link>
              <Link href="/internal/leads/new">
                <Button variant="outline"><Users className="mr-2 h-4 w-4" />Create Lead</Button>
              </Link>
              <Link href="/internal/automation">
                <Button variant="outline"><Workflow className="mr-2 h-4 w-4" />Run Automation</Button>
              </Link>
            </div>
          </div>

          <aside className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-zo-purple-2" />
              <p className="text-sm font-semibold text-white">Agent readout</p>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <BriefingLine label="Attention" value={plural(totalAttention, 'signal')} />
              <BriefingLine label="Revenue motion" value={formatCurrency(openDealValue + openProposalValue)} />
              <BriefingLine label="Business memory" value={`${knowledgeRes.count ?? 0} notes`} />
              <BriefingLine label="This month spend" value={formatCurrency(monthSpend)} />
            </div>
          </aside>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Business Pulse</h2>
          <p className="text-sm text-muted-foreground">Live signals across revenue, delivery, partners, and follow-ups.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <PulseCard icon={Users} label="Active leads" value={leads.length} href="/internal/leads" />
          <PulseCard icon={CheckSquare} label="Open tasks" value={tasks.length} href="/internal/tasks" />
          <PulseCard icon={BriefcaseBusiness} label="Active projects" value={projects.length} href="/internal/projects" />
          <PulseCard icon={Handshake} label="Partner opportunities" value={partnerOpportunities.length} href="/internal/partners" />
          <PulseCard icon={Clock3} label="Pending follow-ups" value={leadsNeedingAction.length + overdueTasks.length} href="/internal/tasks" />
          <PulseCard icon={DollarSign} label="Pipeline value" value={formatCurrency(openDealValue + openProposalValue)} href="/internal/deals" />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <main className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Today&apos;s Priorities" icon={Target} actionHref="/internal/tasks" actionLabel="Open work">
              <PriorityRow icon={CheckSquare} label="Due tasks" value={plural(dueTodayTasks.length + overdueTasks.length, 'task')} href="/internal/tasks" urgent={overdueTasks.length > 0} />
              <PriorityRow icon={Clock3} label="Stuck tasks" value={plural(blockedTasks.length, 'blocked item')} href="/internal/tasks" urgent={blockedTasks.length > 0} />
              <PriorityRow icon={MailCheck} label="Follow-ups due" value={plural(leadsNeedingAction.length, 'lead')} href="/internal/leads" urgent={leadsNeedingAction.length > 0} />
              <PriorityRow icon={BriefcaseBusiness} label="Projects without recent activity" value={plural(projectsWithoutRecentActivity.length, 'project')} href="/internal/projects" urgent={projectsWithoutRecentActivity.length > 0} />
              <PriorityRow icon={CalendarDays} label="Meetings today" value={plural(todayMeetings.length, 'meeting')} href="/internal/meetings?calendar=my" />
            </Panel>

            <Panel title="Revenue Motion" icon={TrendingUp} actionHref="/internal/deals" actionLabel="Open pipeline">
              <MetricRow label="New leads" value={String(newLeads.length)} />
              <MetricRow label="Qualified leads" value={String(qualifiedLeads.length)} />
              <MetricRow label="Open deals" value={`${deals.length} / ${formatCurrency(openDealValue)}`} />
              <MetricRow label="Proposals or contracts" value={`${proposals.length} / ${formatCurrency(openProposalValue)}`} />
              <div className="rounded-lg border border-zo-purple/25 bg-zo-purple/10 p-3 text-sm">
                <p className="font-semibold text-zo-purple-2">AI recommendation</p>
                <p className="mt-1 text-muted-foreground">
                  {leadsNeedingAction.length
                    ? 'Prioritize the oldest lead follow-up before creating new pipeline.'
                    : 'Pipeline is clean. Ask the agent for the next partner or outbound move.'}
                </p>
              </div>
            </Panel>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Team Rhythm" icon={MessageSquareText} actionHref="/internal/meetings" actionLabel="Open meetings">
              <RhythmRow label="Daily check-in" value="Placeholder ready" detail="Check-ins are not wired yet; this panel will consume the real check-in table when available." />
              <RhythmRow label="Blockers" value={plural(blockedTasks.length, 'item')} detail={blockedTasks[0]?.title || 'No blocked tasks reported.'} />
              <RhythmRow label="Ownership" value={plural(tasks.filter(row => row.owner_id).length, 'owned task')} detail="Open task ownership is visible from Tasks." />
              <RhythmRow label="Recent updates" value={projects[0]?.title || 'No active projects yet'} detail={projects[0] ? `Updated ${formatDate(projects[0].updated_at)}` : 'Create a project to start tracking delivery.'} />
            </Panel>

            <Panel title="Business Memory" icon={Workflow} actionHref="/internal/knowledge" actionLabel="Open memory">
              {aiRequests.map(row => (
                <Link key={row.id} href="/internal/automation" className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3 hover:border-zo-purple/40">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold capitalize">{row.intent.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(row.created_at)}</p>
                  </div>
                  <ResourceStatusBadge status={row.status} />
                </Link>
              ))}
              {aiRequests.length === 0 && (
                <EmptyState
                  icon={Bot}
                  title="No automation memory yet"
                  description="Agent runs and automation drafts will appear here once activity is available."
                  href="/internal/automation"
                  action="Open automation"
                />
              )}
            </Panel>
          </div>

          <Panel title="Quick Actions" icon={CirclePlus}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction href="/internal/leads/new" icon={Users} label="Create lead" />
              <QuickAction href="/internal/tasks/new" icon={CheckSquare} label="Add task" />
              <QuickAction href="/internal/projects/new" icon={BriefcaseBusiness} label="Add project" />
              <QuickAction href="/internal/partners/new" icon={Handshake} label="Add partner" />
              <QuickAction href="/internal/ideas/new" icon={Lightbulb} label="Add idea" />
              <QuickAction href="/internal/automation" icon={Workflow} label="Open agent/chat" />
              <QuickAction href="/request-build" icon={ReceiptText} label="Request build form" />
              <QuickAction href="/partner-with-us" icon={Handshake} label="Partner form" />
            </div>
          </Panel>
        </main>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-zo-purple/25 bg-card/90 p-4 shadow-xl shadow-black/20">
            <div className="mb-3 flex items-center gap-2">
              <Bot className="h-4 w-4 text-zo-purple" />
              <div>
                <h2 className="text-sm font-semibold">Ask ZeroOrigins Agent</h2>
                <p className="text-xs text-muted-foreground">Turn the briefing into drafts, tasks, meetings, and follow-ups.</p>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {agentPrompts.map(prompt => (
                <span key={prompt} className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                  {prompt}
                </span>
              ))}
            </div>
            <AiAssistPanel embedded />
          </section>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <WalletCards className="h-4 w-4 text-zo-purple" />
                Operating Costs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <MetricRow label="This month spend" value={formatCurrency(monthSpend)} />
              <MetricRow label="Upcoming renewals" value={String(upcomingRenewals.length)} />
              <MetricRow label="Pending payments" value={String(pendingPayments)} />
              <MetricRow label="Active customers" value={String(customers.length)} />
            </CardContent>
          </Card>
        </aside>
      </div>

      {leads.length === 0 && (
        <EmptyState
          icon={Users}
          title="No active leads yet"
          description="Create the first lead so the briefing can start surfacing follow-ups and revenue motion."
          href="/internal/leads/new"
          action="Create lead"
        />
      )}
    </div>
  )
}

function BriefingLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  )
}

function PulseCard({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-border bg-card p-3 transition hover:border-zo-purple/45 hover:bg-zo-purple/5 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <Icon className="h-4 w-4 text-zo-purple" />
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Link>
  )
}

function Panel({ title, icon: Icon, actionHref, actionLabel, children }: { title: string; icon: LucideIcon; actionHref?: string; actionLabel?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-zo-purple" />
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        {actionHref && actionLabel && (
          <Link href={actionHref} className="shrink-0 text-xs font-medium text-zo-purple hover:text-zo-purple-2">
            {actionLabel}
          </Link>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function PriorityRow({ icon: Icon, label, value, href, urgent = false }: { icon: LucideIcon; label: string; value: string; href: string; urgent?: boolean }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3 hover:border-zo-purple/40">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className={urgent ? 'h-4 w-4 shrink-0 text-amber-300' : 'h-4 w-4 shrink-0 text-zo-purple'} />
        <span className="truncate text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="shrink-0 text-sm font-semibold">{value}</span>
    </Link>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/50 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}

function RhythmRow({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <span className="text-xs text-zo-purple-2">{value}</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  )
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href} className="flex min-h-12 items-center gap-2 rounded-lg border border-border bg-background/60 px-3 text-sm font-medium hover:border-zo-purple/40 hover:bg-zo-purple/10">
      <Icon className="h-4 w-4 shrink-0 text-zo-purple" />
      <span>{label}</span>
    </Link>
  )
}

function EmptyState({ icon: Icon, title, description, href, action }: { icon: LucideIcon; title: string; description: string; href: string; action: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/70 p-5 text-center">
      <Icon className="mx-auto h-5 w-5 text-zo-purple" />
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zo-purple hover:text-zo-purple-2">
        {action} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
