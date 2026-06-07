import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TaskForm from '@/components/forms/TaskForm'

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: task } = await supabase.from('tasks').select('*').eq('id', id).single()
  if (!task) notFound()
  return <TaskForm mode="edit" initialData={task} />
}
