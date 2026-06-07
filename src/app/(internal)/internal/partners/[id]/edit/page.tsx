import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PartnerForm from '@/components/forms/PartnerForm'

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: partner } = await supabase.from('partners').select('*').eq('id', id).single()
  if (!partner) notFound()
  return <PartnerForm mode="edit" initialData={partner} />
}
