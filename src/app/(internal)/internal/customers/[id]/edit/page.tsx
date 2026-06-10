import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import CustomerForm from '@/components/forms/CustomerForm'

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id || '').single()
  if (profile?.role !== 'admin') redirect(`/internal/customers/${id}`)
  const { data: customer } = await supabase.from('customers').select('*').eq('id', id).single()
  if (!customer) notFound()
  return <CustomerForm mode="edit" initialData={customer} />
}
