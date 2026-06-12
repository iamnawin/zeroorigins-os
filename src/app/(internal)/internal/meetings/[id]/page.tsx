import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MeetingAiPanel } from '@/components/ai/MeetingAiPanel'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import type { Meeting } from '@/types'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return <div><span className="text-muted-foreground">{label}:</span> {value ?? '-'}</div>
}

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('meetings').select('*').eq('id', id).single()
  if (!data) notFound()
  const meeting = data as Meeting

  const [{ data: lead }, { data: deal }, { data: customer }, { data: project }] = await Promise.all([
    meeting.lead_id ? supabase.from('leads').select('id, name').eq('id', meeting.lead_id).single() : Promise.resolve({ data: null }),
    meeting.deal_id ? supabase.from('deals').select('id, name').eq('id', meeting.deal_id).single() : Promise.resolve({ data: null }),
    meeting.customer_id ? supabase.from('customers').select('id, name').eq('id', meeting.customer_id).single() : Promise.resolve({ data: null }),
    meeting.project_id ? supabase.from('projects').select('id, title').eq('id', meeting.project_id).single() : Promise.resolve({ data: null }),
  ])

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/internal/meetings">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        </Link>
        <Link href={`/internal/meetings/${id}/edit`}>
          <Button size="sm"><Pencil className="w-4 h-4 mr-1" />Edit</Button>
        </Link>
      </div>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zo-chrome">{meeting.title}</CardTitle>
            <ResourceStatusBadge status={meeting.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Scheduled" value={formatDateTime(meeting.scheduled_at)} />
            <Field label="Duration" value={`${meeting.duration_minutes} minutes`} />
            <Field label="Attendees" value={meeting.attendees?.join(', ')} />
            <Field label="Created" value={formatDateTime(meeting.created_at)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {lead && <Link href={`/internal/leads/${lead.id}`} className="text-zo-purple-2 hover:underline">Lead: {lead.name}</Link>}
            {deal && <Link href={`/internal/deals/${deal.id}`} className="text-zo-purple-2 hover:underline">Deal: {deal.name}</Link>}
            {customer && <Link href={`/internal/customers/${customer.id}`} className="text-zo-purple-2 hover:underline">Customer: {customer.name}</Link>}
            {project && <Link href={`/internal/projects/${project.id}`} className="text-zo-purple-2 hover:underline">Project: {project.title}</Link>}
          </div>
          {meeting.agenda && <p className="whitespace-pre-wrap"><span className="font-medium">Agenda:</span> {meeting.agenda}</p>}
          {meeting.outcome && <p className="whitespace-pre-wrap"><span className="font-medium">Outcome:</span> {meeting.outcome}</p>}
          {meeting.next_action && <p className="rounded-md border border-border bg-muted/20 p-3"><span className="font-medium">Next action:</span> {meeting.next_action}</p>}
        </CardContent>
      </Card>
      <MeetingAiPanel meetingId={meeting.id} />
    </div>
  )
}
