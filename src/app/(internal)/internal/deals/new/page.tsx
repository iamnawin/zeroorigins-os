import { createClient } from '@/lib/supabase/server'
import DealForm from '@/components/forms/DealForm'

export default async function NewDealPage() {
  const supabase = await createClient()
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, company')
    .not('status', 'in', '("lost","archived")')
    .order('created_at', { ascending: false })

  return <DealForm mode="create" leads={leads ?? []} />
}
