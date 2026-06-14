'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KNOWLEDGE_CATEGORIES, type KnowledgeArticle } from '@/types'
import { createKnowledgeArticle, updateKnowledgeArticle } from '@/lib/actions/internal-resources'

interface Props {
  mode: 'create' | 'edit'
  initialData?: Partial<KnowledgeArticle>
}

function formatCategory(value: string) {
  return value.replace(/_/g, ' ')
}

const categoryHelp = 'Use company_policy for policies, brand_collateral for brand docs, and course_material for institute content.'

export default function KnowledgeArticleForm({ mode, initialData }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [category, setCategory] = useState(initialData?.category ?? 'project_document')
  const [tags, setTags] = useState(initialData?.tags?.join(', ') ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = { title, content, category, tags }
      const result = mode === 'create'
        ? await createKnowledgeArticle(payload)
        : await updateKnowledgeArticle(initialData!.id!, payload)

      if (result.error) throw new Error(result.error)
      router.push(mode === 'create' ? `/internal/knowledge/${result.id}` : `/internal/knowledge/${initialData!.id}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-zo-chrome">{mode === 'create' ? 'New Knowledge Document' : 'Edit Knowledge Document'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={event => setTitle(event.target.value)} required placeholder="Decision, SOP, project note..." />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <select value={category} onChange={event => setCategory(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {KNOWLEDGE_CATEGORIES.map(item => (
                    <option key={item} value={item}>{formatCategory(item)}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">{categoryHelp}</p>
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input value={tags} onChange={event => setTags(event.target.value)} placeholder="project, finance, decision" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={event => setContent(event.target.value)}
                rows={14}
                placeholder="Capture the source-of-truth details, decision, process, or notes here."
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : mode === 'create' ? 'Create Document' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
