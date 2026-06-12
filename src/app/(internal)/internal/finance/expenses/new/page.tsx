import FinanceTransactionForm from '@/components/forms/FinanceTransactionForm'
import { createClient } from '@/lib/supabase/server'

export default async function NewFinanceExpensePage() {
  const supabase = await createClient()
  const [{ data: vendors }, { data: projects }, { data: customers }, { data: apps }] = await Promise.all([
    supabase.from('vendors').select('id, name').order('name', { ascending: true }),
    supabase.from('projects').select('id, title').order('created_at', { ascending: false }).limit(100),
    supabase.from('customers').select('id, name, company').order('created_at', { ascending: false }).limit(100),
    supabase.from('ai_workspace_apps').select('id, name').order('created_at', { ascending: false }).limit(100),
  ])

  return (
    <FinanceTransactionForm
      mode="create"
      vendors={(vendors ?? []).map(row => ({ id: row.id, label: row.name }))}
      projects={(projects ?? []).map(row => ({ id: row.id, label: row.title }))}
      customers={(customers ?? []).map(row => ({ id: row.id, label: row.company || row.name }))}
      apps={(apps ?? []).map(row => ({ id: row.id, label: row.name }))}
    />
  )
}
