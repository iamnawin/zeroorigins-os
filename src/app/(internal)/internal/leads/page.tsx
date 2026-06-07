import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: leads } = await supabase.from('leads').select('*').order('created_at', { ascending: false })

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
          <p className="text-sm text-muted-foreground text-center py-8">No leads yet.</p>
        )}
      </div>
    </div>
  )
}
