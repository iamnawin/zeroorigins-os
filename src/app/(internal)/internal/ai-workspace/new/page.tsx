import { AppForm } from '@/components/forms/AppForm'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'

export default function NewAppPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto selection:bg-zo-purple/20">
      <ResourcePageHeader
        title="Add New App"
        description="Register a new repository or experiment in the AI Workspace."
        showNew={false}
      />
      <AppForm />
    </div>
  )
}
