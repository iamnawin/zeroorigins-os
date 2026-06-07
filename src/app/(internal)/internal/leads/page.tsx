import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CLOSED = ['archived', 'lost']

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()
  let query = supabase.from('leads').select('*').order('created_at', { ascending: false })
  if (!showAll) query = query.not('status', 'in', `(${CLOSED.join(',')})`)
  const { data: leads } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zo-chrome">Leads</h1>
          <p className="text-sm text-muted-foreground">Inbound leads and pipeline</p>
        </div>
        <Link href="/internal/leads/new">
          <Button size="sm"><Plus className="w-4 h-4 mr-1" />New Lead</Button>
        </Link>
      </div>
      <div className="flex gap-1">
        <Link href="/internal/leads">
          <span className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${!showAll ? 'text-zo-amber border border-zo-amber/50' : 'text-muted-foreground hover:text-foreground'}`}>Active</span>
        </Link>
        <Link href="/internal/leads?view=all">
          <span className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${showAll ? 'text-zo-amber border border-zo-amber/50' : 'text-muted-foreground hover:text-foreground'}`}>All</span>
        </Link>
      </div>
      <div className="grid gap-3">
        {leads?.map(lead => (
          <Link key={lead.id} href={`/internal/leads/${lead.id}`}>
            <Card className="bg-card border-border hover:border-zo-amber/30 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{lead.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{lead.company || lead.email} · {lead.service_interest}</p>
                </div>
                <div className="flex items-center gap-2">
                  {lead.source && <Badge variant="outline" className="text-[10px]">{lead.source}</Badge>}
                  <Badge className="text-[10px]">{lead.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!leads || leads.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {showAll ? 'No leads yet.' : 'No active leads. '}
            {!showAll && <Link href="/internal/leads?view=all" className="text-zo-amber hover:underline">View all</Link>}
          </p>
        )}
      </div>
    </div>
  )
}
