import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { CrmActionButton } from '@/components/internal/crm-action-button'
import type { Proposal } from '@/types'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span> {value || '—'}
    </div>
  )
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null
}

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('proposals').select('*').eq('id', id).single()
  if (!data) notFound()
  const proposal = data as Proposal

  const [{ data: lead }, { data: customer }] = await Promise.all([
    proposal.lead_id
      ? supabase.from('leads').select('id, name, status').eq('id', proposal.lead_id).single()
      : Promise.resolve({ data: null }),
    proposal.customer_id
      ? supabase.from('customers').select('id, name, status').eq('id', proposal.customer_id).single()
      : Promise.resolve({ data: null }),
  ])

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/internal/proposals">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        </Link>
        <div className="flex gap-2">
          {proposal.status !== 'accepted' && (
            <CrmActionButton label="Mark Accepted" action="markProposalAccepted" resourceId={id} />
          )}
          <Link href={`/internal/proposals/${id}/edit`}>
            <Button size="sm" variant="outline">Edit</Button>
          </Link>
        </div>
      </div>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zo-chrome">{proposal.title}</CardTitle>
            <ResourceStatusBadge status={proposal.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Service type" value={proposal.service_type} />
            <Field label="Amount" value={proposal.amount != null ? proposal.amount.toLocaleString() : null} />
            <Field label="Timeline" value={proposal.timeline} />
            <Field label="Expires" value={formatDate(proposal.expires_at)} />
            <Field label="Sent" value={formatDate(proposal.sent_at)} />
            <Field label="Created" value={formatDate(proposal.created_at)} />
            <div>
              <span className="text-muted-foreground">Lead:</span>{' '}
              {lead ? (
                <Link href={`/internal/leads/${lead.id}`} className="text-zo-purple-2 hover:underline">{lead.name}</Link>
              ) : '—'}
            </div>
            <div>
              <span className="text-muted-foreground">Customer:</span>{' '}
              {customer ? (
                <Link href={`/internal/customers/${customer.id}`} className="text-zo-purple-2 hover:underline">{customer.name}</Link>
              ) : '—'}
            </div>
          </div>
          {proposal.proposal_url && (
            <a href={proposal.proposal_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-zo-purple-2 hover:underline">
              <ExternalLink className="w-3.5 h-3.5" />Open proposal document
            </a>
          )}
        </CardContent>
      </Card>
      {(proposal.scope || proposal.content) && (
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-zo-chrome text-base">Scope &amp; Content</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {proposal.scope && <p className="whitespace-pre-wrap">{proposal.scope}</p>}
            {proposal.content && <p className="whitespace-pre-wrap border-t border-border pt-3">{proposal.content}</p>}
          </CardContent>
        </Card>
      )}
      {(proposal.internal_notes || proposal.customer_visible_notes) && (
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-zo-chrome text-base">Notes</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {proposal.internal_notes && (
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-zo-muted mb-1">Internal</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{proposal.internal_notes}</p>
              </div>
            )}
            {proposal.customer_visible_notes && (
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-zo-muted mb-1">Customer-visible</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{proposal.customer_visible_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
