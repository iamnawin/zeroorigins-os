import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  CirclePlus,
  Clock3,
  DollarSign,
  Handshake,
  Lightbulb,
  MailCheck,
  MessageSquareText,
  Plus,
  ReceiptText,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  WalletCards,
  Workflow,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AiAssistPanel } from '@/components/ai/AiAssistPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  RadarItem,
  Task,
} from '@/types'

const defaultCurrency = 'INR'

function formatCurrency(value: number, currency = defaultCurrency) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'No date'
}

function formatDateTime(value?: string | null) {
  return value
    ? new Date(value).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'No time'
}

function formatTime(value?: string | null) {
  return value
    ? new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    : ''
}

function plural(count: number, singular: string, pluralLabel = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralLabel}`
}

function truncate(text: string, max = 44) {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

type SuggestedMove = {
  label: string
  subtext: string
  href: string
  tone: 'urgent' | 'revenue' | 'attention' | 'create' | 'steady'
}

function radarSignalScore(item: RadarItem) {
  return Math.max(Number(item.relevance_score ?? 0), Number(item.content_potential_score ?? 0))
}

function humanizeRepoTitle(value: string) {
  const repoName = value.split('/').pop() || value
  return repoName
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function firstSentence(value?: string | null) {
  const text = value?.trim()
  if (!text) return ''
  const sentence = text.match(/^[^.!?]+[.!?]/)?.[0] ?? text
  return truncate(sentence.replace(/\s+/g, ' '), 92)
}

function readableRadarHeadline(item: RadarItem) {
  const rawTitle = item.title.trim()
  const isRepoTitle = /^[\w.-]+\/[\w.-]+$/.test(rawTitle)
  const signalText = firstSentence(item.why_it_matters || item.ai_summary || item.summary)

  if (isRepoTitle && signalText) {
    return `${humanizeRepoTitle(rawTitle)}: ${signalText}`
  }

  if (isRepoTitle) return humanizeRepoTitle(rawTitle)
  return truncate(rawTitle, 92)
}

function buildSuggestedMoves(opts: {
  leads: Lead[]
  tasks: Task[]
  projects: Project[]
  partners: Partner[]
  todayMeetings: Meeting[]
  leadsNeedingAction: Lead[]
  overdueTasks: Task[]
  blockedTasks: Task[]
  partnerOpportunities: Partner[]
  projectsWithoutRecentActivity: Project[]
}): SuggestedMove[] {
  const {
    leads, tasks, projects,
    overdueTasks, blockedTasks, leadsNeedingAction,
    todayMeetings, partnerOpportunities, projectsWithoutRecentActivity,
  } = opts
  const moves: SuggestedMove[] = []

  if (overdueTasks.length > 0) {
    moves.push({
      label: truncate(overdueTasks[0].title),
      subtext: `Overdue task · clear now`,
      href: `/internal/tasks/${overdueTasks[0].id}`,
      tone: 'urgent',
    })
  } else if (blockedTasks.length > 0) {
    moves.push({
      label: truncate(blockedTasks[0].title),
      subtext: `Blocked · needs attention`,
      href: `/internal/tasks/${blockedTasks[0].id}`,
      tone: 'attention',
    })
  }

  if (leadsNeedingAction.length > 0) {
    const lead = leadsNeedingAction[0]
    moves.push({
      label: lead.name,
      subtext: `Follow up · ${lead.status.replace(/_/g, ' ')}`,
      href: `/internal/leads/${lead.id}`,
      tone: 'revenue',
    })
  }

  if (projectsWithoutRecentActivity.length > 0) {
    const project = projectsWithoutRecentActivity[0]
    moves.push({
      label: truncate(project.title),
      subtext: 'No recent activity · resume',
      href: `/internal/projects/${project.id}`,
      tone: 'attention',
    })
  }

  if (todayMeetings.length > 0) {
    const meeting = todayMeetings[0]
    moves.push({
      label: truncate(meeting.title),
      subtext: `Meeting today · ${formatTime(meeting.scheduled_at)}`,
      href: `/internal/meetings/${meeting.id}`,
      tone: 'steady',
    })
  }

  const newPartner = partnerOpportunities.find(p => p.status === 'new_application')
  if (newPartner) {
    moves.push({
      label: newPartner.name,
      subtext: 'New partner application',
      href: `/internal/partners/${newPartner.id}`,
      tone: 'steady',
    })
  }

  // Empty-state fillers
  if (moves.length < 3 && leads.length === 0) {
    moves.push({ label: 'Create your first lead', subtext: 'Start the revenue pipeline', href: '/internal/leads/new', tone: 'create' })
  }
  if (moves.length < 3 && tasks.length === 0) {
    moves.push({ label: "Add today's priority task", subtext: 'Plan your delivery work', href: '/internal/tasks/new', tone: 'create' })
  }
  if (moves.length < 3 && projects.length === 0) {
    moves.push({ label: 'Start first project', subtext: 'Create a delivery workspace', href: '/internal/projects/new', tone: 'create' })
  }
  if (moves.length < 3) {
    moves.push({ label: 'Ask agent to plan the week', subtext: 'Use Command Center for a planning session', href: '/internal/automation', tone: 'steady' })
  }
  if (moves.length < 4) {
    moves.push({ label: 'Add a partner', subtext: 'Grow your partner network', href: '/internal/partners/new', tone: 'create' })
  }

  return moves.slice(0, 5)
}

const TONE = {
  urgent:    { card: 'border-amber-500/25 hover:border-amber-500/50 hover:bg-amber-500/5',   dot: 'bg-amber-400',   sub: 'text-amber-400/80',   arrow: 'text-amber-400' },
  revenue:   { card: 'border-emerald-500/25 hover:border-emerald-500/50 hover:bg-emerald-500/5', dot: 'bg-emerald-400', sub: 'text-emerald-400/80', arrow: 'text-emerald-400' },
  attention: { card: 'border-orange-500/25 hover:border-orange-500/50 hover:bg-orange-500/5', dot: 'bg-orange-400',  sub: 'text-orange-400/80',  arrow: 'text-orange-400' },
  create:    { card: 'border-zo-purple/30 hover:border-zo-purple/60 hover:bg-zo-purple/5',    dot: 'bg-zo-purple',   sub: 'text-zo-purple-2/80', arrow: 'text-zo-purple-2' },
  steady:    { card: 'border-white/10 hover:border-white/20 hover:bg-white/[0.03]',           dot: 'bg-white/25',    sub: 'text-muted-foreground', arrow: 'text-muted-foreground' },
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
    radarRes,
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
    supabase.from('radar_items')
      .select('*, source:radar_sources(id, name, source_type, trust_level)')
      .not('status', 'in', '(ignored,archived)')
      .order('captured_at', { ascending: false })
      .limit(24),
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
  const radarItems = (radarRes.data ?? []) as unknown as RadarItem[]

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
  const hotRadarSignals = [...radarItems]
    .sort((a, b) => radarSignalScore(b) - radarSignalScore(a))
    .slice(0, 4)
  const urgentRadarCount = hotRadarSignals.filter(item => radarSignalScore(item) >= 8).length

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'there'
  const totalAttention = overdueTasks.length + blockedTasks.length + leadsNeedingAction.length + todayMeetings.length

  // Executive briefing copy
  const briefingLines: string[] = []
  if (overdueTasks.length) briefingLines.push(`${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`)
  if (blockedTasks.length) briefingLines.push(`${blockedTasks.length} blocked`)
  if (leadsNeedingAction.length) briefingLines.push(`${leadsNeedingAction.length} lead follow-up${leadsNeedingAction.length > 1 ? 's' : ''}`)
  if (todayMeetings.length) briefingLines.push(`${todayMeetings.length} meeting${todayMeetings.length > 1 ? 's' : ''} today`)
  if (urgentRadarCount) briefingLines.push(`${urgentRadarCount} hot Radar signal${urgentRadarCount > 1 ? 's' : ''}`)

  const briefingSummary = briefingLines.length > 0
    ? `Active signals: ${briefingLines.join(' · ')}.`
    : leads.length === 0 && tasks.length === 0
      ? `Your workspace is ready. Start by adding a lead, creating today's task, or asking the agent to plan your first operating move.`
      : `All clear. Use the agent to surface the next growth or delivery move.`

  const moves = buildSuggestedMoves({
    leads, tasks, projects, partners, todayMeetings,
    leadsNeedingAction, overdueTasks, blockedTasks,
    partnerOpportunities, projectsWithoutRecentActivity,
  })

  return (
    <div className="space-y-6">

      {/* ── 1. AI BRIEFING HERO ─────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-zo-purple/20 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(139,92,246,0.14),transparent_70%),linear-gradient(180deg,rgba(14,14,18,1),rgba(8,8,10,1))] p-6 shadow-2xl shadow-black/50 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1fr_17rem]">

          {/* Left: briefing content */}
          <div className="space-y-5">
            {/* Status bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="outline" className="gap-1.5 border-zo-purple/35 bg-zo-purple/10 text-zo-purple-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Command Center · Live
              </Badge>
              <span className="text-xs text-muted-foreground">{formatDateTime(now.toISOString())}</span>
            </div>

            {/* Main heading */}
            <div>
              <p className="text-sm font-medium text-zo-purple-2">{greeting}, {displayName}</p>
              <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {totalAttention > 0 ? 'Here is what matters today.' : 'Your workspace is ready.'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">{briefingSummary}</p>
            </div>

            {/* Attention signal chips */}
            {totalAttention > 0 && (
              <div className="flex flex-wrap gap-2">
                {overdueTasks.length > 0 && (
                  <Link href="/internal/tasks" className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300 transition hover:border-amber-500/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {overdueTasks.length} overdue
                  </Link>
                )}
                {blockedTasks.length > 0 && (
                  <Link href="/internal/tasks" className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs text-orange-300 transition hover:border-orange-500/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                    {blockedTasks.length} blocked
                  </Link>
                )}
                {leadsNeedingAction.length > 0 && (
                  <Link href="/internal/leads" className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 transition hover:border-emerald-500/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {leadsNeedingAction.length} follow-up{leadsNeedingAction.length > 1 ? 's' : ''}
                  </Link>
                )}
                {todayMeetings.length > 0 && (
                  <Link href="/internal/meetings" className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300 transition hover:border-blue-500/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {todayMeetings.length} meeting{todayMeetings.length > 1 ? 's' : ''} today
                  </Link>
                )}
              </div>
            )}

            {/* Suggested moves */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
              {moves.slice(0, 3).map(move => (
                <Link
                  key={move.href}
                  href={move.href}
                  className={`group rounded-xl border bg-white/[0.025] p-3.5 transition ${TONE[move.tone].card}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${TONE[move.tone].dot}`} />
                    <ArrowRight className={`h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-100 ${TONE[move.tone].arrow}`} />
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-snug text-white">{move.label}</p>
                  <p className={`mt-1 text-[11px] ${TONE[move.tone].sub}`}>{move.subtext}</p>
                </Link>
              ))}
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-2">
              <Link href="/internal/tasks/new">
                <Button size="sm"><CirclePlus className="mr-1.5 h-3.5 w-3.5" />Add Task</Button>
              </Link>
              <Link href="/internal/leads/new">
                <Button size="sm" variant="outline"><Users className="mr-1.5 h-3.5 w-3.5" />Create Lead</Button>
              </Link>
              <Link href="/internal/automation">
                <Button size="sm" variant="outline"><Workflow className="mr-1.5 h-3.5 w-3.5" />Automation</Button>
              </Link>
            </div>
          </div>

          {/* Right: Agent readout */}
          <aside className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Agent Readout</p>
            </div>
            <div className="space-y-3 text-sm">
              <ReadoutLine label="Attention signals" value={totalAttention > 0 ? plural(totalAttention, 'signal') : 'None'} highlight={totalAttention > 0} />
              <ReadoutLine label="Revenue motion" value={openDealValue + openProposalValue > 0 ? formatCurrency(openDealValue + openProposalValue) : '—'} />
              <ReadoutLine label="Business memory" value={knowledgeRes.count ? `${knowledgeRes.count} notes` : '—'} />
              <ReadoutLine label="This month spend" value={monthSpend > 0 ? formatCurrency(monthSpend) : '—'} />
            </div>

            <div className="mt-5 space-y-1.5">
              {moves.slice(3).map(move => (
                <Link
                  key={move.href}
                  href={move.href}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-xs text-muted-foreground transition hover:border-zo-purple/30 hover:text-foreground"
                >
                  <span className="truncate">{move.label}</span>
                  <ArrowRight className="h-3 w-3 shrink-0" />
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* ── 2. ZO_AGENT COMMAND BAR ─────────────────────────────── */}
      {/* AiAssistPanel embedded — AiAssistPanel embedded */}
      <section className="rounded-2xl border border-zo-purple/25 bg-[linear-gradient(135deg,rgba(139,92,246,0.07),rgba(0,0,0,0)_60%)] p-5 shadow-xl shadow-black/20">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zo-purple/15">
              <Sparkles className="h-3.5 w-3.5 text-zo-purple" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Command Center</h2>
              <p className="text-xs text-muted-foreground">Type or speak your next move — draft, create, or search</p>
            </div>
          </div>
          <span className="hidden text-[10px] text-muted-foreground/50 sm:block">Powered by Together AI</span>
        </div>
        <AiAssistPanel embedded showHeader={false} />
      </section>

      <section className="rounded-2xl border border-zo-purple/25 bg-card p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-zo-purple" />
            <div>
              <h2 className="text-base font-semibold text-white">Headlines to Catch</h2>
              <p className="text-xs text-muted-foreground">Ranked by Radar score across news, AI updates, funding, tools, and events.</p>
            </div>
          </div>
          <Link href="/internal/radar" className="inline-flex items-center gap-1 text-xs font-medium text-zo-purple hover:text-zo-purple-2">
            Open Radar <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {hotRadarSignals.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {hotRadarSignals.map(item => (
              <HotRadarSignalCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptySection
            icon={Zap}
            title="No Radar news yet"
            description="Run RSS sync or add sources to start catching hot market signals here."
            href="/internal/radar"
            action="Open Radar"
          />
        )}
      </section>

      {/* ── 3. BUSINESS PULSE ───────────────────────────────────── */}
      <AccordionPanel title="Business Pulse" icon={TrendingUp} summary="Live business signals" defaultOpen>
        <div className="hidden">
          <Zap className="h-4 w-4 text-zo-purple" />
          <h2 className="text-sm font-semibold">Business Pulse</h2>
          <span className="text-xs text-muted-foreground">· live signals</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <PulseCard icon={Users} label="Active leads" value={leads.length} href="/internal/leads" empty={leads.length === 0} emptyAction="Add a lead" />
          <PulseCard icon={CheckSquare} label="Open tasks" value={tasks.length} href="/internal/tasks" urgent={overdueTasks.length > 0} />
          <PulseCard icon={BriefcaseBusiness} label="Active projects" value={projects.length} href="/internal/projects" empty={projects.length === 0} emptyAction="Start project" />
          <PulseCard icon={Handshake} label="Partner opps" value={partnerOpportunities.length} href="/internal/partners" />
          <PulseCard icon={Clock3} label="Follow-ups due" value={leadsNeedingAction.length + overdueTasks.length} href="/internal/tasks" urgent={(leadsNeedingAction.length + overdueTasks.length) > 0} />
          <PulseCard icon={DollarSign} label="Pipeline value" value={formatCurrency(openDealValue + openProposalValue)} href="/internal/deals" />
        </div>
      </AccordionPanel>

      {/* ── 4. MAIN GRID ────────────────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <main className="space-y-5">

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Today's Priorities */}
            <AccordionPanel title="Today's Priorities" icon={Target} actionHref="/internal/tasks" actionLabel="Open work" summary={plural(dueTodayTasks.length + overdueTasks.length, 'task')} defaultOpen>
              <PriorityRow icon={CheckSquare} label="Due tasks" value={plural(dueTodayTasks.length + overdueTasks.length, 'task')} href="/internal/tasks" urgent={overdueTasks.length > 0} />
              <PriorityRow icon={Clock3} label="Stuck tasks" value={plural(blockedTasks.length, 'blocked item')} href="/internal/tasks" urgent={blockedTasks.length > 0} />
              <PriorityRow icon={MailCheck} label="Follow-ups due" value={plural(leadsNeedingAction.length, 'lead')} href="/internal/leads" urgent={leadsNeedingAction.length > 0} />
              <PriorityRow icon={BriefcaseBusiness} label="Stale projects" value={plural(projectsWithoutRecentActivity.length, 'project')} href="/internal/projects" urgent={projectsWithoutRecentActivity.length > 0} />
              <PriorityRow icon={CalendarDays} label="Meetings today" value={plural(todayMeetings.length, 'meeting')} href="/internal/meetings?calendar=my" />
              {tasks.length === 0 && (
                <EmptyPrompt
                  text="No open tasks yet."
                  action="Create today's priority"
                  href="/internal/tasks/new"
                />
              )}
            </AccordionPanel>

            {/* Revenue Motion */}
            <AccordionPanel title="Revenue Motion" icon={TrendingUp} actionHref="/internal/deals" actionLabel="Open pipeline" summary={formatCurrency(openDealValue + openProposalValue)} defaultOpen>
              <MetricRow label="New leads" value={String(newLeads.length)} />
              <MetricRow label="Qualified leads" value={String(qualifiedLeads.length)} />
              <MetricRow label="Open deals" value={`${deals.length} / ${formatCurrency(openDealValue)}`} />
              <MetricRow label="Proposals or contracts" value={`${proposals.length} / ${formatCurrency(openProposalValue)}`} />
              {leads.length === 0 ? (
                <EmptyPrompt
                  text="No pipeline yet."
                  action="Add first lead"
                  href="/internal/leads/new"
                  agentPrompt="Create a lead capture plan"
                />
              ) : (
                <div className="rounded-lg border border-zo-purple/20 bg-zo-purple/[0.06] p-3">
                  <p className="text-xs font-semibold text-zo-purple-2">AI recommendation</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {leadsNeedingAction.length
                      ? 'Prioritize the oldest lead follow-up before creating new pipeline.'
                      : 'Pipeline is clean. Ask the agent for the next partner or outbound move.'}
                  </p>
                </div>
              )}
            </AccordionPanel>
          </div>

          {/* Team Rhythm */}
          <AccordionPanel title="Team Rhythm" icon={MessageSquareText} actionHref="/internal/meetings" actionLabel="Open meetings" summary={blockedTasks.length > 0 ? plural(blockedTasks.length, 'blocker') : plural(todayMeetings.length, 'meeting')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <RhythmRow label="Blockers" value={plural(blockedTasks.length, 'item')} detail={blockedTasks[0]?.title || 'No blocked tasks reported.'} urgent={blockedTasks.length > 0} />
              <RhythmRow label="Owned tasks" value={plural(tasks.filter(row => row.owner_id).length, 'task')} detail="Open task ownership visible from Tasks." />
              <RhythmRow label="Meetings today" value={plural(todayMeetings.length, 'meeting')} detail={todayMeetings[0]?.title || 'No meetings scheduled.'} />
              <RhythmRow
                label="Last active project"
                value={projects[0]?.title ? truncate(projects[0].title, 28) : 'None'}
                detail={projects[0] ? `Updated ${formatDate(projects[0].updated_at)}` : 'Create a project to track delivery.'}
              />
            </div>
          </AccordionPanel>

          {/* Quick Actions */}
          <AccordionPanel title="Quick Actions" icon={CirclePlus} summary="Create common records">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction href="/internal/leads/new" icon={Users} label="Create lead" />
              <QuickAction href="/internal/tasks/new" icon={CheckSquare} label="Add task" />
              <QuickAction href="/internal/projects/new" icon={BriefcaseBusiness} label="Add project" />
              <QuickAction href="/internal/partners/new" icon={Handshake} label="Add partner" />
              <QuickAction href="/internal/ideas/new" icon={Lightbulb} label="Add idea" />
              <QuickAction href="/internal/automation" icon={Workflow} label="Open agent" />
              <QuickAction href="/request-build" icon={ReceiptText} label="Request build" />
              <QuickAction href="/partner-with-us" icon={Handshake} label="Partner form" />
            </div>
          </AccordionPanel>
        </main>

        {/* ── Right aside ─── */}
        <aside className="space-y-5">

          {/* Business Memory */}
          <AccordionPanel title="Agent Activity" icon={Bot} actionHref="/internal/automation" actionLabel="Open automation" summary={aiRequests.length > 0 ? plural(aiRequests.length, 'draft') : 'No drafts'}>
            {aiRequests.length > 0 ? (
              aiRequests.map(row => (
                <Link
                  key={row.id}
                  href="/internal/automation"
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3 hover:border-zo-purple/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium capitalize">{row.intent.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(row.created_at)}</p>
                  </div>
                  <ResourceStatusBadge status={row.status} />
                </Link>
              ))
            ) : (
              <EmptySection
                icon={Bot}
                title="No agent activity yet"
                description="Agent drafts and automation runs will appear here."
                href="/internal/automation"
                action="Open automation"
                agentPrompt="What should I do first?"
              />
            )}
          </AccordionPanel>

          {/* Operating Costs */}
          <AccordionPanel title="Operating Costs" icon={WalletCards} actionHref="/internal/finance" actionLabel="Open finance" summary={monthSpend > 0 ? formatCurrency(monthSpend) : 'No spend'}>
            <MetricRow label="This month spend" value={monthSpend > 0 ? formatCurrency(monthSpend) : '—'} />
            <MetricRow label="Upcoming renewals" value={String(upcomingRenewals.length)} />
            <MetricRow label="Pending payments" value={String(pendingPayments)} />
            <MetricRow label="Active customers" value={String(customers.length)} />
          </AccordionPanel>
        </aside>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ReadoutLine({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-2.5 last:border-0 last:pb-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? 'text-amber-300' : 'text-white'}`}>{value}</span>
    </div>
  )
}

function PulseCard({
  icon: Icon, label, value, href, urgent = false, empty = false, emptyAction,
}: {
  icon: LucideIcon; label: string; value: string | number; href: string;
  urgent?: boolean; empty?: boolean; emptyAction?: string;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-xl border p-3.5 transition sm:p-4 ${
        urgent
          ? 'border-amber-500/25 bg-amber-500/[0.04] hover:border-amber-500/45'
          : 'border-border bg-card hover:border-zo-purple/40 hover:bg-zo-purple/[0.04]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <Icon className={`h-3.5 w-3.5 ${urgent ? 'text-amber-400' : 'text-zo-purple'}`} />
        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
      </div>
      <p className={`mt-3 text-2xl font-bold ${empty ? 'text-muted-foreground' : 'text-foreground'}`}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      {empty && emptyAction && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-zo-purple">
          <Plus className="h-3 w-3" />{emptyAction}
        </p>
      )}
    </Link>
  )
}

function AccordionPanel({
  title, icon: Icon, actionHref, actionLabel, summary, defaultOpen = false, children,
}: {
  title: string; icon: LucideIcon; actionHref?: string; actionLabel?: string; summary?: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 marker:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-3.5 w-3.5 shrink-0 text-zo-purple" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{title}</h2>
            {summary && <p className="mt-0.5 truncate text-xs text-muted-foreground">{summary}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {actionHref && actionLabel && (
            <Link href={actionHref} className="hidden text-xs font-medium text-zo-purple hover:text-zo-purple-2 sm:inline">
              {actionLabel}
            </Link>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
        </div>
      </summary>
      <div className="space-y-2.5 border-t border-border px-4 pb-4 pt-3">{children}</div>
    </details>
  )
}

function HotRadarSignalCard({ item }: { item: RadarItem }) {
  const score = radarSignalScore(item)
  const scoreTone = score >= 8 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-zo-purple/30 bg-zo-purple/10 text-zo-purple-2'
  const sourceName = item.source_name || item.source?.name || 'Radar source'
  const headline = readableRadarHeadline(item)

  return (
    <Link
      href={`/internal/radar/${item.id}`}
      className="group rounded-xl border border-border bg-background/60 p-3.5 transition hover:border-zo-purple/40 hover:bg-zo-purple/[0.04]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{headline}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {item.why_it_matters || item.ai_summary || item.summary || 'Review this signal and decide whether to save, action, or turn it into content.'}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-xs font-semibold ${scoreTone}`}>{score}/10</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="min-w-0 truncate text-[11px] text-muted-foreground">{sourceName}</span>
        <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(item.published_at || item.captured_at)}</span>
      </div>
    </Link>
  )
}

function PriorityRow({
  icon: Icon, label, value, href, urgent = false,
}: {
  icon: LucideIcon; label: string; value: string; href: string; urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5 transition hover:border-zo-purple/35"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Icon className={urgent ? 'h-3.5 w-3.5 shrink-0 text-amber-400' : 'h-3.5 w-3.5 shrink-0 text-zo-purple'} />
        <span className="truncate text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="shrink-0 text-xs font-semibold">{value}</span>
    </Link>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/50 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  )
}

function RhythmRow({
  label, value, detail, urgent = false,
}: {
  label: string; value: string; detail: string; urgent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">{label}</p>
        <span className={`text-xs ${urgent ? 'text-amber-400' : 'text-zo-purple-2'}`}>{value}</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  )
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background/60 px-3 text-xs font-medium transition hover:border-zo-purple/35 hover:bg-zo-purple/[0.06]"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-zo-purple" />
      <span>{label}</span>
    </Link>
  )
}

function EmptyPrompt({
  text, action, href, agentPrompt,
}: {
  text: string; action: string; href: string; agentPrompt?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-background/40 px-3 py-3">
      <p className="text-xs text-muted-foreground">{text}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-zo-purple hover:text-zo-purple-2">
          <Plus className="h-3 w-3" />{action}
        </Link>
        {agentPrompt && (
          <span className="text-xs text-muted-foreground/50">or ask: &ldquo;{agentPrompt}&rdquo;</span>
        )}
      </div>
    </div>
  )
}

function EmptySection({
  icon: Icon, title, description, href, action, agentPrompt,
}: {
  icon: LucideIcon; title: string; description: string; href: string; action: string; agentPrompt?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-center">
      <Icon className="mx-auto h-5 w-5 text-zo-purple/50" />
      <p className="mt-2 text-xs font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-zo-purple hover:text-zo-purple-2">
          {action} <ArrowRight className="h-3 w-3" />
        </Link>
        {agentPrompt && (
          <span className="text-xs text-muted-foreground/50">or: &ldquo;{agentPrompt}&rdquo;</span>
        )}
      </div>
    </div>
  )
}
