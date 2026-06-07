import { createClient } from '@/lib/supabase/server'
import { AppForm } from '@/components/forms/AppForm'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditAppPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: app } = await supabase
    .from('ai_workspace_apps')
    .select('*')
    .eq('id', id)
    .single()

  if (!app) notFound()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <ResourcePageHeader
        title={`Edit ${app.name}`}
        description="Update app details and status."
        showNew={false}
      />
      <AppForm initialData={app} />
    </div>
  )
}
