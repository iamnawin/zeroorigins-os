import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProposalForm from '@/components/forms/ProposalForm'

export default async function EditProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: proposal } = await supabase.from('proposals').select('*').eq('id', id).single()
  if (!proposal) notFound()
  return <ProposalForm mode="edit" initialData={proposal} />
}
