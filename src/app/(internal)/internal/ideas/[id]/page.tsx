import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: idea } = await supabase.from('ideas').select('*').eq('id', id).single()
  if (!idea) notFound()

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/internal/ideas">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        </Link>
        <Link href={`/internal/ideas/${id}/edit`}>
          <Button size="sm" variant="outline">Edit</Button>
        </Link>
      </div>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zo-chrome">{idea.title}</CardTitle>
            <div className="flex gap-2">
              {idea.priority && <Badge variant="outline">{idea.priority}</Badge>}
              <Badge>{idea.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{idea.description || 'No description.'}</p>
          <div className="mt-4 text-xs text-muted-foreground">
            Created: {new Date(idea.created_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
