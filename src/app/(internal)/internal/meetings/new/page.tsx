import { createClient } from '@/lib/supabase/server'
import MeetingForm from '@/components/forms/MeetingForm'

export default async function NewMeetingPage({
  searchParams,
}: {
  searchParams: Promise<{ lead_id?: string; deal_id?: string; customer_id?: string; project_id?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const [{ data: leads }, { data: deals }, { data: customers }, { data: projects }] = await Promise.all([
    supabase.from('leads').select('id, name, company').order('created_at', { ascending: false }).limit(50),
    supabase.from('deals').select('id, name').order('created_at', { ascending: false }).limit(50),
    supabase.from('customers').select('id, name, company').order('created_at', { ascending: false }).limit(50),
    supabase.from('projects').select('id, title').order('created_at', { ascending: false }).limit(50),
  ])

  return (
    <MeetingForm
      mode="create"
      initialData={{
        lead_id: params.lead_id,
        deal_id: params.deal_id,
        customer_id: params.customer_id,
        project_id: params.project_id,
      }}
      leads={(leads ?? []).map(row => ({ id: row.id, label: row.company || row.name }))}
      deals={(deals ?? []).map(row => ({ id: row.id, label: row.name }))}
      customers={(customers ?? []).map(row => ({ id: row.id, label: row.company || row.name }))}
      projects={(projects ?? []).map(row => ({ id: row.id, label: row.title }))}
    />
  )
}
