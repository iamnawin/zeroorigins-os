import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CLOSED = ['archived', 'rejected']

export default async function IdeasPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()
  let query = supabase.from('ideas').select('*').order('created_at', { ascending: false })
  if (!showAll) query = query.not('status', 'in', `(${CLOSED.join(',')})`)
  const { data: ideas } = await query

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
      <div className="flex gap-1">
        <Link href="/internal/ideas">
          <span className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${!showAll ? 'text-zo-amber border border-zo-amber/50' : 'text-muted-foreground hover:text-foreground'}`}>Active</span>
        </Link>
        <Link href="/internal/ideas?view=all">
          <span className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${showAll ? 'text-zo-amber border border-zo-amber/50' : 'text-muted-foreground hover:text-foreground'}`}>All</span>
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
          <p className="text-sm text-muted-foreground text-center py-8">
            {showAll ? 'No ideas yet.' : 'No active ideas. '}
            {!showAll && <Link href="/internal/ideas?view=all" className="text-zo-amber hover:underline">View all</Link>}
          </p>
        )}
      </div>
    </div>
  )
}
