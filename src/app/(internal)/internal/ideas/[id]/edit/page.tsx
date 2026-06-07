import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import IdeaForm from '@/components/forms/IdeaForm'

export default async function EditIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: idea } = await supabase.from('ideas').select('*').eq('id', id).single()
  if (!idea) notFound()
  return <IdeaForm mode="edit" initialData={idea} />
}
