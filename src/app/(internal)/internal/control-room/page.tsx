import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CheckSquare,
  DollarSign,
  FileText,
  Plus,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import type { Deal, Lead, Meeting, Proposal, Task } from '@/types'

type PipelineItem = {
  id: string
  href: string
  title: string
  meta: string
  status: string
  value?: string
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-'
}

function money(value?: number | null) {
  return value == null ? undefined : value.toLocaleString()
}

function WorkItem({ href, title, meta, status, value }: PipelineItem) {
  return (
    <Link href={href} className="block rounded-md border border-border bg-background/60 p-3 hover:border-zo-purple/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          <p className="text-[11px] text-muted-foreground truncate">{meta}</p>
        </div>
        <ResourceStatusBadge status={status} />
      </div>
      {value && <p className="mt-2 text-xs font-medium text-zo-purple-2">{value}</p>}
    </Link>
  )
}

function StageColumn({ title, items }: { title: string; items: PipelineItem[] }) {
  return (
    <div className="min-w-64 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{items.length}</span>
      </div>
      <div className="space-y-2 p-2">
        {items.length > 0 ? items.map(item => <WorkItem key={item.href} {...item} />) : (
          <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">No records</div>
        )}
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, href }: { icon: React.ElementType; title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-zo-purple" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <Link href={href} className="text-xs text-muted-foreground hover:text-zo-purple-2">View all</Link>
    </div>
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

  const [
    leadsRes,
    dealsRes,
    proposalsRes,
    meetingsRes,
    tasksRes,
  ] = await Promise.all([
    supabase.from('leads').select('*').not('status', 'in', '("lost","archived")').order('created_at', { ascending: false }).limit(50),
    supabase.from('deals').select('*').not('stage', 'in', '("lost")').order('created_at', { ascending: false }).limit(50),
    supabase.from('proposals').select('*').not('status', 'in', '("accepted","rejected","expired")').order('created_at', { ascending: false }).limit(50),
    supabase.from('meetings').select('*').order('scheduled_at', { ascending: true }).limit(20),
    supabase.from('tasks').select('*').not('status', 'in', '("done","cancelled")').order('created_at', { ascending: false }).limit(50),
  ])

  const leads = (leadsRes.data ?? []) as Lead[]
  const deals = (dealsRes.data ?? []) as Deal[]
  const proposals = (proposalsRes.data ?? []) as Proposal[]
  const meetings = (meetingsRes.data ?? []) as Meeting[]
  const tasks = (tasksRes.data ?? []) as Task[]
  const now = new Date()
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const newLeads = leads.filter(row => ['new', 'contacted', 'discovery_scheduled'].includes(row.status)).map(row => ({
    id: row.id,
    href: `/internal/leads/${row.id}`,
    title: row.company || row.name,
    meta: row.service_interest || row.email,
    status: row.status,
    value: row.budget_range,
  }))

  const qualifiedDeals = deals.filter(row => ['qualifying', 'proposal'].includes(row.stage)).map(row => ({
    id: row.id,
    href: `/internal/deals/${row.id}`,
    title: row.name,
    meta: row.next_step || formatDate(row.expected_close_date),
    status: row.stage,
    value: money(row.estimated_value),
  }))

  const sentProposals = proposals.filter(row => ['draft', 'internal_review', 'sent', 'viewed', 'revision_requested'].includes(row.status)).map(row => ({
    id: row.id,
    href: `/internal/proposals/${row.id}`,
    title: row.title,
    meta: row.service_type || formatDate(row.expires_at),
    status: row.status,
    value: money(row.amount),
  }))

  const closingDeals = deals.filter(row => ['negotiation', 'won', 'on_hold'].includes(row.stage)).map(row => ({
    id: row.id,
    href: `/internal/deals/${row.id}`,
    title: row.name,
    meta: row.next_step || formatDate(row.expected_close_date),
    status: row.stage,
    value: money(row.estimated_value),
  }))

  const todayMeetings = meetings.filter(row => new Date(row.scheduled_at) <= todayEnd && row.status === 'scheduled').slice(0, 5)
  const overdueTasks = tasks.filter(row => row.due_date && new Date(`${row.due_date}T23:59:59`) < now).slice(0, 5)
  const hotLeads = leads
    .filter(row => (row.ai_score ?? 0) >= 70 || ['proposal_needed', 'proposal_sent', 'negotiation'].includes(row.status))
    .slice(0, 5)
  const assistItems = [
    ...leads.filter(row => !row.ai_summary).slice(0, 3).map(row => ({ href: `/internal/leads/${row.id}`, label: `Add AI summary for ${row.company || row.name}` })),
    ...deals.filter(row => !row.next_step).slice(0, 3).map(row => ({ href: `/internal/deals/${row.id}`, label: `Define next step for ${row.name}` })),
    ...proposals.filter(row => row.status === 'sent' && !row.customer_visible_notes).slice(0, 3).map(row => ({ href: `/internal/proposals/${row.id}`, label: `Add customer-facing notes for ${row.title}` })),
  ].slice(0, 6)

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'there'
  const stats: { label: string; count: number; icon: LucideIcon }[] = [
    { label: 'Open Leads', count: leads.length, icon: Users },
    { label: 'Open Deals', count: deals.length, icon: DollarSign },
    { label: 'Proposals', count: proposals.length, icon: FileText },
    { label: 'Meetings', count: todayMeetings.length, icon: CalendarDays },
    { label: 'Open Tasks', count: tasks.length, icon: CheckSquare },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zo-purple-2">Pipeline Cockpit</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Welcome back, {displayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Run today from leads, deals, meetings, proposals, and follow-ups.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/internal/leads/new"><Button size="sm"><Plus className="h-4 w-4 mr-1" />Lead</Button></Link>
          <Link href="/internal/deals/new"><Button size="sm" variant="outline"><DollarSign className="h-4 w-4 mr-1" />Deal</Button></Link>
          <Link href="/internal/meetings/new"><Button size="sm" variant="outline"><CalendarDays className="h-4 w-4 mr-1" />Meeting</Button></Link>
          <Link href="/internal/tasks/new"><Button size="sm" variant="outline"><CheckSquare className="h-4 w-4 mr-1" />Task</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(({ label, count, icon: Icon }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold text-foreground">{count}</p>
              </div>
              <Icon className="h-5 w-5 text-zo-purple" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <SectionHeader icon={DollarSign} title="Sales Pipeline" href="/internal/deals?layout=board" />
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            <StageColumn title="New Leads" items={newLeads} />
            <StageColumn title="Qualified" items={qualifiedDeals} />
            <StageColumn title="Proposal" items={sentProposals} />
            <StageColumn title="Closing" items={closingDeals} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader><SectionHeader icon={CalendarDays} title="Today" href="/internal/meetings" /></CardHeader>
          <CardContent className="space-y-2">
            {todayMeetings.map(row => (
              <WorkItem key={row.id} id={row.id} href={`/internal/meetings/${row.id}`} title={row.title} meta={formatDateTime(row.scheduled_at)} status={row.status} />
            ))}
            {todayMeetings.length === 0 && <p className="text-sm text-muted-foreground">No meetings due today.</p>}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><SectionHeader icon={CheckSquare} title="Overdue Follow-ups" href="/internal/tasks" /></CardHeader>
          <CardContent className="space-y-2">
            {overdueTasks.map(row => (
              <WorkItem key={row.id} id={row.id} href={`/internal/tasks/${row.id}`} title={row.title} meta={`Due ${formatDate(row.due_date)}`} status={row.status} />
            ))}
            {overdueTasks.length === 0 && <p className="text-sm text-muted-foreground">No overdue tasks.</p>}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><SectionHeader icon={Bot} title="AI Assist" href="/internal/leads" /></CardHeader>
          <CardContent className="space-y-2">
            {assistItems.map(item => (
              <Link key={item.href + item.label} href={item.href} className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:border-zo-purple/40">
                <span className="line-clamp-1">{item.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            {assistItems.length === 0 && <p className="text-sm text-muted-foreground">No AI assist gaps right now.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader><SectionHeader icon={Users} title="Priority Records" href="/internal/leads" /></CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {hotLeads.map(row => (
            <WorkItem
              key={row.id}
              id={row.id}
              href={`/internal/leads/${row.id}`}
              title={row.company || row.name}
              meta={row.ai_summary || row.service_interest || row.email}
              status={row.status}
              value={row.ai_score != null ? `AI score ${row.ai_score}` : row.budget_range}
            />
          ))}
          {hotLeads.length === 0 && <p className="text-sm text-muted-foreground">No hot leads yet. Add leads or qualify existing records.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
