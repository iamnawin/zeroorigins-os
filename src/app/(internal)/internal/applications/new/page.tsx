import { ApplicationForm } from '@/components/forms/ApplicationForm'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { createClient } from '@/lib/supabase/server'

export default async function NewApplicationPage() {
  const supabase = await createClient()
  const { data: verticals } = await supabase.from('business_verticals').select('id, name').order('name')

  return (
    <div className="space-y-6">
      <ResourcePageHeader
        title="New Application"
        description="Add a product, app, automation, website, or internal system to the registry."
        showNew={false}
      />
      <ApplicationForm verticals={verticals ?? []} />
    </div>
  )
}
