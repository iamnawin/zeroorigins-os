import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function IdeasPage() {
  const supabase = await createClient()
  const { data: ideas } = await supabase.from('ideas').select('*').order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zo-chrome">Ideas</h1>
          <p className="text-sm text-muted-foreground">Capture and review ideas before execution</p>
        </div>
        <Link href="/internal/ideas/new">
          <Button size="sm"><Plus className="w-4 h-4 mr-1" />New Idea</Button>
        </Link>
      </div>
      <div className="grid gap-3">
        {ideas?.map(idea => (
          <Link key={idea.id} href={`/internal/ideas/${idea.id}`}>
            <Card className="bg-card border-border hover:border-zo-amber/30 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{idea.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{idea.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {idea.priority && <Badge variant="outline" className="text-[10px]">{idea.priority}</Badge>}
                  <Badge className="text-[10px]">{idea.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!ideas || ideas.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">No ideas yet. Create your first one.</p>
        )}
      </div>
    </div>
  )
}
