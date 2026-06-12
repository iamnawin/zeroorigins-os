import { notFound } from 'next/navigation'
import { BusinessVerticalForm } from '@/components/forms/BusinessVerticalForm'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { createClient } from '@/lib/supabase/server'
import type { BusinessVertical } from '@/types'

export default async function EditBusinessVerticalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('business_verticals').select('*').eq('id', id).single()
  if (!data) notFound()

  return (
    <div className="space-y-6">
      <ResourcePageHeader title="Edit Business Vertical" description="Update ownership, status, positioning, and notes." showNew={false} />
      <BusinessVerticalForm initialData={data as BusinessVertical} />
    </div>
  )
}
