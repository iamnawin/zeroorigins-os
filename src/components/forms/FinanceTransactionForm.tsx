'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FINANCE_CATEGORIES,
  FINANCE_TRANSACTION_STATUSES,
  RECURRENCE_INTERVALS,
  type FinanceTransaction,
} from '@/types'
import { createFinanceTransaction, updateFinanceTransaction } from '@/lib/actions/internal-resources'

interface LinkOption {
  id: string
  label: string
}

interface Props {
  mode: 'create' | 'edit'
  initialData?: Partial<FinanceTransaction>
  vendors?: LinkOption[]
  projects?: LinkOption[]
  customers?: LinkOption[]
  apps?: LinkOption[]
}

export default function FinanceTransactionForm({
  mode,
  initialData,
  vendors = [],
  projects = [],
  customers = [],
  apps = [],
}: Props) {
  const [form, setForm] = useState({
    description: initialData?.description ?? '',
    amount: initialData?.amount?.toString() ?? '',
    currency: initialData?.currency ?? 'USD',
    category: initialData?.category ?? 'software',
    status: initialData?.status ?? 'paid',
    vendor_id: initialData?.vendor_id ?? '',
    project_id: initialData?.project_id ?? '',
    customer_id: initialData?.customer_id ?? '',
    ai_workspace_app_id: initialData?.ai_workspace_app_id ?? '',
    date: initialData?.date ?? new Date().toISOString().slice(0, 10),
    due_date: initialData?.due_date ?? '',
    paid_at: initialData?.paid_at ?? '',
    invoice_url: initialData?.invoice_url ?? '',
    receipt_url: initialData?.receipt_url ?? '',
    recurrence_interval: initialData?.recurrence_interval ?? 'none',
    next_due_date: initialData?.next_due_date ?? '',
    notes: initialData?.notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const set = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(value => ({ ...value, [key]: event.target.value }))

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = mode === 'create'
        ? await createFinanceTransaction(form)
        : await updateFinanceTransaction(initialData!.id!, form)

      if (result.error) throw new Error(result.error)

      router.push('/internal/finance')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-zo-chrome">{mode === 'create' ? 'New Spending Record' : 'Edit Spending Record'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={set('description')} required placeholder="Vercel hosting, Together AI credits..." />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} required />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input value={form.currency} onChange={set('currency')} maxLength={3} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={form.status} onChange={set('status')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {FINANCE_TRANSACTION_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select value={form.category} onChange={set('category')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {FINANCE_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <select value={form.vendor_id} onChange={set('vendor_id')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">No vendor</option>
                  {vendors.map(row => <option key={row.id} value={row.id}>{row.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Recurrence</Label>
                <select value={form.recurrence_interval} onChange={set('recurrence_interval')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {RECURRENCE_INTERVALS.map(interval => <option key={interval} value={interval}>{interval}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Spend Date</Label>
                <Input type="date" value={form.date} onChange={set('date')} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={set('due_date')} />
              </div>
              <div className="space-y-2">
                <Label>Paid Date</Label>
                <Input type="date" value={form.paid_at} onChange={set('paid_at')} />
              </div>
              <div className="space-y-2">
                <Label>Next Due</Label>
                <Input type="date" value={form.next_due_date} onChange={set('next_due_date')} />
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <select value={form.project_id} onChange={set('project_id')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">No project</option>
                  {projects.map(row => <option key={row.id} value={row.id}>{row.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Customer</Label>
                <select value={form.customer_id} onChange={set('customer_id')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">No customer</option>
                  {customers.map(row => <option key={row.id} value={row.id}>{row.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>AI App</Label>
                <select value={form.ai_workspace_app_id} onChange={set('ai_workspace_app_id')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">No app</option>
                  {apps.map(row => <option key={row.id} value={row.id}>{row.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Invoice URL</Label>
                <Input value={form.invoice_url} onChange={set('invoice_url')} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Receipt URL</Label>
                <Input value={form.receipt_url} onChange={set('receipt_url')} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={set('notes')} rows={3} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : mode === 'create' ? 'Create Spending Record' : 'Save Changes'}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
