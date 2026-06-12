import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MeetingForm from '@/components/forms/MeetingForm'
import type { Meeting } from '@/types'

export default async function EditMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: meeting }, { data: owners }, { data: leads }, { data: deals }, { data: customers }, { data: projects }] = await Promise.all([
    supabase.from('meetings').select('*').eq('id', id).single(),
    supabase.from('profiles').select('id, email, full_name').in('role', ['admin', 'employee']).eq('status', 'active').order('email', { ascending: true }),
    supabase.from('leads').select('id, name, company').order('created_at', { ascending: false }).limit(50),
    supabase.from('deals').select('id, name').order('created_at', { ascending: false }).limit(50),
    supabase.from('customers').select('id, name, company').order('created_at', { ascending: false }).limit(50),
    supabase.from('projects').select('id, title').order('created_at', { ascending: false }).limit(50),
  ])

  if (!meeting) notFound()

  return (
    <MeetingForm
      mode="edit"
      initialData={meeting as Meeting}
      owners={(owners ?? []).map(row => ({ id: row.id, label: row.full_name || row.email }))}
      leads={(leads ?? []).map(row => ({ id: row.id, label: row.company || row.name }))}
      deals={(deals ?? []).map(row => ({ id: row.id, label: row.name }))}
      customers={(customers ?? []).map(row => ({ id: row.id, label: row.company || row.name }))}
      projects={(projects ?? []).map(row => ({ id: row.id, label: row.title }))}
    />
  )
}
