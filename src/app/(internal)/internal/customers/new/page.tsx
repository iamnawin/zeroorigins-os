import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CustomerForm from '@/components/forms/CustomerForm'

export default async function NewCustomerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id || '').single()
  if (profile?.role !== 'admin') redirect('/internal/customers')
  return <CustomerForm mode="create" />
}
