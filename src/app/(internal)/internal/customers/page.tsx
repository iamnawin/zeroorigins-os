import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceViewTabs } from '@/components/resource-kit/resource-view-tabs'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { EntityTable, type TableColumn } from '@/components/resource-kit/entity-table'
import { terminalStatusFilter } from '@/lib/resource-kit/status'
import type { Customer } from '@/types'

const BASE = '/internal/customers'

const TABLE_COLUMNS: TableColumn<Customer>[] = [
  { key: 'name', label: 'Name', render: r => r.name },
  { key: 'company', label: 'Company', render: r => r.company || <span className="text-muted-foreground/40">—</span> },
  { key: 'email', label: 'Email', render: r => r.email },
  { key: 'phone', label: 'Phone', width: '130px', render: r => r.phone || <span className="text-muted-foreground/40">—</span> },
  { key: 'status', label: 'Status', width: '110px', render: r => <ResourceStatusBadge status={r.status} /> },
  { key: 'created_at', label: 'Since', width: '100px', render: r => <span>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span> },
]

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id || '').single()
  const isAdmin = profile?.role === 'admin'

  let query = supabase.from('customers').select('*').order('created_at', { ascending: false })
  if (!showAll) query = query.not('status', 'in', terminalStatusFilter('customers'))
  const { data: customers } = await query
  const rows = (customers ?? []) as Customer[]

  return (
    <div className="space-y-5">
      <ResourcePageHeader
        title="Customers"
        description="Active customer accounts and relationship history"
        newHref={`${BASE}/new`}
        newLabel="New Customer"
        showNew={isAdmin}
      />
      <ResourceViewTabs basePath={BASE} showAll={showAll} />
      {rows.length === 0 ? (
        <ResourceEmptyState
          showAll={showAll}
          basePath={BASE}
          title="No customer accounts yet"
          description="Keep this clean until a lead or deal actually converts. Customer records should become the account history after real work starts, not placeholder CRM data."
          actionHref="/internal/leads"
          actionLabel="Review leads"
        />
      ) : (
        <EntityTable rows={rows} columns={TABLE_COLUMNS} getHref={r => `${BASE}/${r.id}`} />
      )}
    </div>
  )
}
