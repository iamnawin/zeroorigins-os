import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).single()
  if (!lead) notFound()

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/internal/leads">
        <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
      </Link>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zo-chrome">{lead.name}</CardTitle>
            <Badge>{lead.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Email:</span> {lead.email}</div>
            <div><span className="text-muted-foreground">Company:</span> {lead.company || '—'}</div>
            <div><span className="text-muted-foreground">Source:</span> {lead.source || '—'}</div>
            <div><span className="text-muted-foreground">Budget:</span> {lead.budget_range || '—'}</div>
            <div className="col-span-2"><span className="text-muted-foreground">Interest:</span> {lead.service_interest || '—'}</div>
          </div>
          {lead.notes && <p className="text-sm text-muted-foreground border-t border-border pt-3 mt-3">{lead.notes}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
