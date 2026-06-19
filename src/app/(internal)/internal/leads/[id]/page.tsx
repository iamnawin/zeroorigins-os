import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireInternalUser } from '@/lib/actions/internal-resources'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CalendarPlus, FileText } from 'lucide-react'
import { CrmActionButton } from '@/components/internal/crm-action-button'
import { DeleteResourceButton } from '@/components/internal/delete-resource-button'
import type { Lead } from '@/types'

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span> {value ?? '—'}
    </div>
  )
}

function LeadStateCard({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/internal/leads">
        <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
      </Link>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-zo-chrome">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{message}</p>
          <Link href="/internal/leads">
            <Button size="sm">Open Leads</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  await requireInternalUser(supabase)
  let data: Lead | null = null
  let loadError: unknown = null
  try {
    const serviceSupabase = createServiceClient()
    const result = await serviceSupabase.from('leads').select('*').eq('id', id).maybeSingle()
    if (result.error) throw result.error
    data = (result.data as Lead | null) ?? null
  } catch (error) {
    loadError = error
    console.error('Lead detail load failed', error)
  }
  if (loadError) {
    return (
      <LeadStateCard
        title="Lead could not load"
        message="The lead was created, but the detail view could not read it right now. Open the leads list to continue, or reload after the latest deployment finishes."
      />
    )
  }
  if (!data) {
    return (
      <LeadStateCard
        title="Lead not available"
        message="This lead link is stale or the record was deleted. Open the leads list to continue with the current pipeline."
      />
    )
  }
  const lead = data

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/internal/leads">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        </Link>
        <div className="flex gap-2">
          <CrmActionButton
            label="Convert to Deal"
            action="convertLeadToDeal"
            resourceId={id}
            redirectTo={dealId => `/internal/deals/${dealId}`}
          />
          <Link href={`/internal/meetings/new?lead_id=${id}`}>
            <Button size="sm" variant="outline"><CalendarPlus className="w-4 h-4 mr-1" />Meeting</Button>
          </Link>
          <Link href={`/internal/proposals/new?lead=${id}`}>
            <Button size="sm" variant="outline"><FileText className="w-4 h-4 mr-1" />Proposal</Button>
          </Link>
          <Link href={`/internal/leads/${id}/edit`}>
            <Button size="sm">Edit</Button>
          </Link>
          <DeleteResourceButton id={id} kind="lead" />
        </div>
      </div>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zo-chrome">{lead.name}</CardTitle>
            <Badge>{lead.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Email" value={lead.email} />
            <Field label="Company" value={lead.company} />
            <Field label="Phone" value={lead.phone} />
            <Field label="WhatsApp" value={lead.whatsapp} />
            <Field label="Website" value={lead.website} />
            <Field label="Source" value={lead.source} />
            <Field label="Source detail" value={lead.source_detail} />
            <Field label="Budget" value={lead.budget_range} />
            <Field label="Preferred contact" value={lead.preferred_contact_method} />
            <Field label="Preferred call time" value={lead.preferred_call_time} />
            <Field
              label="Last contacted"
              value={lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null}
            />
            <div className="col-span-2"><span className="text-muted-foreground">Interest:</span> {lead.service_interest || '—'}</div>
          </div>
          {lead.notes && <p className="text-sm text-muted-foreground border-t border-border pt-3 mt-3">{lead.notes}</p>}
        </CardContent>
      </Card>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-zo-chrome text-base">Automation & Qualification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Automation status" value={lead.automation_status} />
            <Field label="Automation source" value={lead.automation_source} />
            <Field label="AI score" value={lead.ai_score} />
            <Field label="Workflow ID" value={lead.n8n_workflow_id} />
          </div>
          {lead.ai_summary && (
            <div className="text-sm border-t border-border pt-3">
              <span className="text-muted-foreground">AI summary:</span> {lead.ai_summary}
            </div>
          )}
          {lead.qualification_notes && (
            <div className="text-sm border-t border-border pt-3">
              <span className="text-muted-foreground">Qualification notes:</span> {lead.qualification_notes}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
