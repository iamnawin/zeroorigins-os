import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DealForm from '@/components/forms/DealForm'
import type { Deal } from '@/types'

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: deal }, { data: leads }] = await Promise.all([
    supabase.from('deals').select('*').eq('id', id).single(),
    supabase.from('leads').select('id, name, company').order('created_at', { ascending: false }),
  ])
  if (!deal) notFound()

  return <DealForm mode="edit" initialData={deal as Deal} leads={leads ?? []} />
}
