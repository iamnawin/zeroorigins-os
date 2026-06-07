import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import LeadForm from '@/components/forms/LeadForm'

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).single()
  if (!lead) notFound()
  return <LeadForm mode="edit" initialData={lead} />
}
