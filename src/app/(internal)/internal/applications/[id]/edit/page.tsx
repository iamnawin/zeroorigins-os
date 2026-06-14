import { notFound } from 'next/navigation'
import { ApplicationForm } from '@/components/forms/ApplicationForm'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { createClient } from '@/lib/supabase/server'
import type { Application } from '@/types'

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('applications').select('*').eq('id', id).single()
  if (!data) notFound()
  const { data: verticals } = await supabase.from('business_verticals').select('id, name').order('name')

  return (
    <div className="space-y-6">
      <ResourcePageHeader title="Edit Application" description="Update registry details, source links, status, and notes." showNew={false} />
      <ApplicationForm initialData={data as Application} verticals={verticals ?? []} />
    </div>
  )
}
