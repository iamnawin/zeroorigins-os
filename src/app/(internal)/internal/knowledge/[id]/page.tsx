import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { KnowledgeArticle } from '@/types'

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatCategory(value?: string | null) {
  return value ? value.replace(/_/g, ' ') : 'uncategorized'
}

export default async function KnowledgeArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('knowledge_articles').select('*').eq('id', id).single()
  if (!data) notFound()
  const article = data as KnowledgeArticle

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/internal/knowledge">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        </Link>
        <Link href={`/internal/knowledge/${id}/edit`}>
          <Button size="sm"><Pencil className="w-4 h-4 mr-1" />Edit</Button>
        </Link>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-zo-purple-2">{formatCategory(article.category)}</p>
            <CardTitle className="text-2xl text-zo-chrome">{article.title}</CardTitle>
            <p className="text-xs text-muted-foreground">Updated {formatDate(article.updated_at)}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {article.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <span key={tag} className="rounded-full border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">{tag}</span>
              ))}
            </div>
          ) : null}
          <div className="whitespace-pre-wrap rounded-lg border border-border bg-background/60 p-5 text-sm leading-7 text-foreground">
            {article.content || 'No content recorded yet.'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
