import Link from 'next/link'
import { Bot, CalendarDays, CheckSquare, CirclePlus, MailCheck, ReceiptText, Users, WalletCards, Workflow } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AiAssistPanel } from '@/components/ai/AiAssistPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import type { AiAssistRequest, Deal, FinanceTransaction, Lead, Meeting, Proposal, Task } from '@/types'

const defaultCurrency = 'INR'

function formatCurrency(value: number, currency = defaultCurrency) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-'
}

export default async function ControlRoomPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user?.id || '').single()

  const [leadsRes, dealsRes, proposalsRes, meetingsRes, tasksRes, financeRes, aiRes, knowledgeRes] = await Promise.all([
    supabase.from('leads').select('*').not('status', 'in', '("lost","archived")').order('created_at', { ascending: false }).limit(20),
    supabase.from('deals').select('*').not('stage', 'in', '("lost")').order('created_at', { ascending: false }).limit(20),
    supabase.from('proposals').select('*').not('status', 'in', '("accepted","rejected","expired")').order('created_at', { ascending: false }).limit(20),
    supabase.from('meetings').select('*').order('scheduled_at', { ascending: true }).limit(20),
    supabase.from('tasks').select('*').not('status', 'in', '("done","cancelled")').order('created_at', { ascending: false }).limit(20),
    supabase.from('finance_transactions').select('*').eq('type', 'expense').order('date', { ascending: false }).limit(50),
    supabase.from('ai_assist_requests').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('knowledge_articles').select('id', { count: 'exact', head: true }),
  ])

  const leads = (leadsRes.data ?? []) as Lead[]
  const deals = (dealsRes.data ?? []) as Deal[]
  const proposals = (proposalsRes.data ?? []) as Proposal[]
  const meetings = (meetingsRes.data ?? []) as Meeting[]
  const tasks = (tasksRes.data ?? []) as Task[]
  const financeRows = (financeRes.data ?? []) as FinanceTransaction[]
  const aiRequests = (aiRes.data ?? []) as AiAssistRequest[]
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const todayMeetings = meetings.filter(row => row.scheduled_at?.slice(0, 10) === today)
  const overdueTasks = tasks.filter(row => row.due_date && row.due_date < today)
  const upcomingRenewals = financeRows.filter(row => row.next_due_date && row.next_due_date >= today).slice(0, 3)
  const newLeads = leads.filter(row => row.status === 'new').slice(0, 3)
  const monthSpend = financeRows
    .filter(row => row.date && row.date >= monthStart && row.date <= monthEnd && row.status !== 'cancelled')
    .reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const pendingPayments = financeRows.filter(row => ['planned', 'due', 'overdue'].includes(row.status)).length
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'there'

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-zo-purple-2">Control Room</p>
        <h1 className="mt-1 text-2xl font-bold">Welcome back, {displayName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Start with today’s focus, then use Quick Actions or AI Assist to move work forward.</p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <section className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-base">Today&apos;s Focus</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <FocusRow icon={MailCheck} label="Emails needing review" value="Open Email Router" href="/internal/automation?tab=email-router" />
              <FocusRow icon={CheckSquare} label="Overdue tasks" value={`${overdueTasks.length} task${overdueTasks.length === 1 ? '' : 's'}`} href="/internal/tasks" />
              <FocusRow icon={CalendarDays} label="Today's meetings" value={`${todayMeetings.length} meeting${todayMeetings.length === 1 ? '' : 's'}`} href="/internal/meetings?calendar=my" />
              <FocusRow icon={ReceiptText} label="Upcoming renewals" value={`${upcomingRenewals.length} renewal${upcomingRenewals.length === 1 ? '' : 's'}`} href="/internal/finance" />
              <FocusRow icon={Users} label="New leads" value={`${newLeads.length} lead${newLeads.length === 1 ? '' : 's'}`} href="/internal/leads" />
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <QuickAction href="/internal/leads/new" label="+ Lead" />
              <QuickAction href="/internal/tasks/new" label="+ Task" />
              <QuickAction href="/internal/meetings/new" label="+ Meeting" />
              <QuickAction href="/internal/finance/vendors/new" label="+ Vendor" />
              <QuickAction href="/internal/automation?tab=calendar-sync" label="Sync Calendar" />
              <QuickAction href="/internal/automation?tab=email-router" label="Run Email Router" />
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-base">Pipeline Snapshot</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <Snapshot label="Open Leads" value={leads.length} />
              <Snapshot label="Open Deals" value={deals.length} />
              <Snapshot label="Proposals" value={proposals.length} />
              <Snapshot label="Customers" value={0} />
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-4">
          <AiAssistPanel embedded />
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><WalletCards className="h-4 w-4 text-zo-purple" />Finance Snapshot</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="This month spend" value={formatCurrency(monthSpend)} />
              <Info label="Upcoming renewals" value={String(upcomingRenewals.length)} />
              <Info label="Pending payments" value={String(pendingPayments)} />
              <Info label="Default currency" value={defaultCurrency} />
            </CardContent>
          </Card>
        </aside>
      </div>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Workflow className="h-4 w-4 text-zo-purple" />Automation Feed</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {aiRequests.map(row => (
            <div key={row.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/60 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.intent.replace(/_/g, ' ')}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(row.created_at)}</p>
              </div>
              <ResourceStatusBadge status={row.status} />
            </div>
          ))}
          {aiRequests.length === 0 && (
            <div className="rounded-md border border-dashed border-border p-5 text-center">
              <Bot className="mx-auto h-5 w-5 text-zo-purple" />
              <p className="mt-2 text-sm font-semibold">No automation events yet.</p>
              <Link href="/internal/automation" className="mt-2 inline-flex text-sm text-zo-purple">Run Email Router Test</Link>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">Knowledge source: {knowledgeRes.count ?? 0} documents and decisions.</p>
    </div>
  )
}

function FocusRow({ icon: Icon, label, value, href }: { icon: typeof CirclePlus; label: string; value: string; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-lg border border-border bg-background/60 p-3 hover:border-zo-purple/40">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-zo-purple" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold">{value}</span>
    </Link>
  )
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}><Button size="sm" variant="outline">{label}</Button></Link>
  )
}

function Snapshot({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
