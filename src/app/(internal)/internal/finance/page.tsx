import Link from 'next/link'
import { AlertTriangle, CalendarClock, DollarSign, Plus, ReceiptText, Repeat, WalletCards } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import type { FinanceTransaction, Vendor } from '@/types'

function money(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
}

function formatDate(value?: string | null) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'
}

function monthBounds() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { start, end, today: now.toISOString().slice(0, 10) }
}

export default async function FinancePage() {
  const supabase = await createClient()
  const { start, end, today } = monthBounds()

  const [{ data: transactions }, { data: vendors }] = await Promise.all([
    supabase
      .from('finance_transactions')
      .select('*, vendors(*)')
      .eq('type', 'expense')
      .order('date', { ascending: false })
      .limit(80),
    supabase.from('vendors').select('*').order('name', { ascending: true }).limit(50),
  ])

  const rows = (transactions ?? []) as (FinanceTransaction & { vendors?: Vendor })[]
  const vendorRows = (vendors ?? []) as Vendor[]
  const monthRows = rows.filter(row => row.date && row.date >= start && row.date <= end && row.status !== 'cancelled')
  const monthSpend = monthRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const aiSpend = monthRows
    .filter(row => row.category === 'ai_api')
    .reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const overdue = rows.filter(row => row.status !== 'paid' && row.status !== 'cancelled' && row.due_date && row.due_date < today)
  const upcoming = rows
    .filter(row => row.status !== 'paid' && row.status !== 'cancelled' && row.due_date && row.due_date >= today)
    .slice(0, 6)
  const recurring = rows.filter(row => row.recurrence_interval && row.recurrence_interval !== 'none').slice(0, 6)
  const byCategory = Object.entries(monthRows.reduce<Record<string, number>>((acc, row) => {
    const key = row.category || 'other'
    acc[key] = (acc[key] ?? 0) + Number(row.amount ?? 0)
    return acc
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const cards = [
    { label: 'This Month', value: money(monthSpend), icon: DollarSign },
    { label: 'AI/API Spend', value: money(aiSpend), icon: WalletCards },
    { label: 'Upcoming Bills', value: String(upcoming.length), icon: CalendarClock },
    { label: 'Overdue', value: String(overdue.length), icon: AlertTriangle },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zo-purple-2">Company Spending</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Finance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track bills, subscriptions, AI API costs, contractors, and project expenses separately from revenue.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/internal/finance/vendors/new"><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Vendor</Button></Link>
          <Link href="/internal/finance/expenses/new"><Button size="sm"><ReceiptText className="h-4 w-4 mr-1" />Spending</Button></Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {cards.map(card => (
          <Card key={card.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <card.icon className="h-4 w-4 text-zo-purple" />
                <p className="text-xl font-bold text-foreground">{card.value}</p>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Upcoming Bills</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcoming.map(row => <MiniRow key={row.id} row={row} />)}
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No upcoming bills.</p>}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Overdue</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overdue.slice(0, 6).map(row => <MiniRow key={row.id} row={row} />)}
            {overdue.length === 0 && <p className="text-sm text-muted-foreground">No overdue bills.</p>}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Recurring Stack</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recurring.map(row => (
              <div key={row.id} className="rounded-md border border-border bg-background/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium">{row.description}</p>
                  <Repeat className="h-3.5 w-3.5 text-zo-purple" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{row.recurrence_interval} · next {formatDate(row.next_due_date || row.due_date)}</p>
              </div>
            ))}
            {recurring.length === 0 && <p className="text-sm text-muted-foreground">No recurring bills yet.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Spending Ledger</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {rows.map(row => (
              <div key={row.id} className="grid gap-3 rounded-md border border-border bg-background/60 p-3 md:grid-cols-[1fr_9rem_7rem_6rem] md:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{row.description}</p>
                  <p className="text-xs text-muted-foreground">{row.vendors?.name || row.category || 'No vendor'} · {formatDate(row.date)}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">{money(Number(row.amount ?? 0), row.currency || 'USD')}</p>
                <ResourceStatusBadge status={row.status} />
                <p className="text-xs text-muted-foreground">{row.due_date ? formatDate(row.due_date) : row.recurrence_interval}</p>
              </div>
            ))}
            {rows.length === 0 && (
              <div className="rounded-md border border-dashed border-border p-6 text-center">
                <p className="text-sm font-medium text-foreground">No spending records yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Add Vercel, Supabase, Together AI, domains, contractors, and other bills here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Categories</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {byCategory.map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between gap-3">
                <p className="truncate text-xs text-muted-foreground">{category.replace(/_/g, ' ')}</p>
                <p className="text-xs font-semibold">{money(amount)}</p>
              </div>
            ))}
            {byCategory.length === 0 && <p className="text-sm text-muted-foreground">No category spend this month.</p>}
            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-foreground">Vendors</p>
              <p className="mt-1 text-xs text-muted-foreground">{vendorRows.length} tracked vendor{vendorRows.length === 1 ? '' : 's'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MiniRow({ row }: { row: FinanceTransaction & { vendors?: Vendor } }) {
  return (
    <div className="rounded-md border border-border bg-background/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{row.description}</p>
          <p className="text-xs text-muted-foreground">{row.vendors?.name || row.category || 'No vendor'} · due {formatDate(row.due_date)}</p>
        </div>
        <p className="text-xs font-semibold">{money(Number(row.amount ?? 0), row.currency || 'USD')}</p>
      </div>
    </div>
  )
}
