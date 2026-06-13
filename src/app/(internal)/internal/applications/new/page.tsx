import { ApplicationForm } from '@/components/forms/ApplicationForm'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'

export default function NewApplicationPage() {
  return (
    <div className="space-y-6">
      <ResourcePageHeader
        title="New Application"
        description="Add a product, app, automation, website, or internal system to the registry."
        showNew={false}
      />
      <ApplicationForm />
    </div>
  )
}
