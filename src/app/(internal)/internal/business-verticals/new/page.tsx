import { BusinessVerticalForm } from '@/components/forms/BusinessVerticalForm'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'

export default function NewBusinessVerticalPage() {
  return (
    <div className="space-y-6">
      <ResourcePageHeader
        title="New Business Vertical"
        description="Create a brand, product, experiment, education initiative, or internal system."
        showNew={false}
      />
      <BusinessVerticalForm />
    </div>
  )
}
