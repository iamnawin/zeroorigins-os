import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarPlus, FileText, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { DeleteResourceButton } from '@/components/internal/delete-resource-button'
import type { Deal, Meeting, Proposal } from '@/types'

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return <div><span className="text-muted-foreground">{label}:</span> {value ?? '-'}</div>
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('deals').select('*').eq('id', id).single()
  if (!data) notFound()
  const deal = data as Deal

  const [{ data: lead }, { data: proposals }, { data: meetings }] = await Promise.all([
    deal.lead_id
      ? supabase.from('leads').select('id, name, status').eq('id', deal.lead_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('proposals').select('*').eq('deal_id', id).order('created_at', { ascending: false }),
    supabase.from('meetings').select('*').eq('deal_id', id).order('scheduled_at', { ascending: true }),
  ])

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/internal/deals">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/internal/meetings/new?deal_id=${id}`}><Button size="sm" variant="outline"><CalendarPlus className="w-4 h-4 mr-1" />Meeting</Button></Link>
          <Link href={`/internal/proposals/new?deal_id=${id}`}><Button size="sm" variant="outline"><FileText className="w-4 h-4 mr-1" />Proposal</Button></Link>
          <Link href={`/internal/deals/${id}/edit`}><Button size="sm"><Pencil className="w-4 h-4 mr-1" />Edit</Button></Link>
          <DeleteResourceButton id={id} kind="deal" />
        </div>
      </div>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zo-chrome">{deal.name}</CardTitle>
            <ResourceStatusBadge status={deal.stage} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Estimated value" value={deal.estimated_value?.toLocaleString()} />
            <Field label="Expected close" value={formatDate(deal.expected_close_date)} />
            <div>
              <span className="text-muted-foreground">Lead:</span>{' '}
              {lead ? <Link href={`/internal/leads/${lead.id}`} className="text-zo-purple-2 hover:underline">{lead.name}</Link> : '-'}
            </div>
            <Field label="Created" value={formatDate(deal.created_at)} />
          </div>
          {deal.next_step && <p className="rounded-md border border-border bg-muted/20 p-3 text-sm"><span className="font-medium">Next step:</span> {deal.next_step}</p>}
          {deal.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.notes}</p>}
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base text-zo-chrome">Proposals</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {((proposals ?? []) as Proposal[]).map(proposal => (
              <Link key={proposal.id} href={`/internal/proposals/${proposal.id}`} className="flex items-center justify-between rounded-md border border-border p-3 hover:border-zo-purple/30">
                <span className="text-sm font-medium">{proposal.title}</span>
                <ResourceStatusBadge status={proposal.status} />
              </Link>
            ))}
            {(!proposals || proposals.length === 0) && <p className="text-sm text-muted-foreground">No proposals yet.</p>}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base text-zo-chrome">Meetings</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {((meetings ?? []) as Meeting[]).map(meeting => (
              <Link key={meeting.id} href={`/internal/meetings/${meeting.id}`} className="flex items-center justify-between rounded-md border border-border p-3 hover:border-zo-purple/30">
                <span className="text-sm font-medium">{meeting.title}</span>
                <span className="text-xs text-muted-foreground">{formatDate(meeting.scheduled_at)}</span>
              </Link>
            ))}
            {(!meetings || meetings.length === 0) && <p className="text-sm text-muted-foreground">No meetings scheduled.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
