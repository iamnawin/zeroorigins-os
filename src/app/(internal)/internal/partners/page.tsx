import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CLOSED = ['archived', 'rejected']

export default async function PartnersPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()
  let query = supabase.from('partners').select('*').order('created_at', { ascending: false })
  if (!showAll) query = query.not('status', 'in', `(${CLOSED.join(',')})`)
  const { data: partners } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zo-chrome">Partners</h1>
          <p className="text-sm text-muted-foreground">Partner and tie-up applications</p>
        </div>
        <Link href="/internal/partners/new">
          <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Partner</Button>
        </Link>
      </div>
      <div className="flex gap-1">
        <Link href="/internal/partners">
          <span className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${!showAll ? 'text-zo-amber border border-zo-amber/50' : 'text-muted-foreground hover:text-foreground'}`}>Active</span>
        </Link>
        <Link href="/internal/partners?view=all">
          <span className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${showAll ? 'text-zo-amber border border-zo-amber/50' : 'text-muted-foreground hover:text-foreground'}`}>All</span>
        </Link>
      </div>
      <div className="grid gap-3">
        {partners?.map(partner => (
          <Link key={partner.id} href={`/internal/partners/${partner.id}`}>
            <Card className="bg-card border-border hover:border-zo-amber/30 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{partner.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{partner.company || partner.email} · {partner.type}</p>
                </div>
                <Badge className="text-[10px]">{partner.status}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!partners || partners.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {showAll ? 'No partners yet.' : 'No active partners. '}
            {!showAll && <Link href="/internal/partners?view=all" className="text-zo-amber hover:underline">View all</Link>}
          </p>
        )}
      </div>
    </div>
  )
}
