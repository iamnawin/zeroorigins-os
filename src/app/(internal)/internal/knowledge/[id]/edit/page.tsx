import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import KnowledgeArticleForm from '@/components/forms/KnowledgeArticleForm'
import type { KnowledgeArticle } from '@/types'

export default async function EditKnowledgeArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('knowledge_articles').select('*').eq('id', id).single()
  if (!data) notFound()

  return <KnowledgeArticleForm mode="edit" initialData={data as KnowledgeArticle} />
}
