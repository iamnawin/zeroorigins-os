import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Partner } from '@/types'

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span> {value ?? '—'}
    </div>
  )
}

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('partners').select('*').eq('id', id).single()
  if (!data) notFound()
  const partner = data as Partner

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/internal/partners">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        </Link>
        <Link href={`/internal/partners/${id}/edit`}>
          <Button size="sm" variant="outline">Edit</Button>
        </Link>
      </div>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zo-chrome">{partner.name}</CardTitle>
            <Badge>{partner.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Email" value={partner.email} />
            <Field label="Company" value={partner.company} />
            <Field label="Type" value={partner.type} />
            <Field label="Phone" value={partner.phone} />
            <Field label="WhatsApp" value={partner.whatsapp} />
            <Field label="Website" value={partner.website} />
            <Field label="LinkedIn" value={partner.linkedin} />
            <Field label="Source detail" value={partner.source_detail} />
          </div>
          {partner.pitch && <p className="text-sm text-muted-foreground border-t border-border pt-3">{partner.pitch}</p>}
          {partner.notes && <p className="text-sm text-muted-foreground border-t border-border pt-3">{partner.notes}</p>}
        </CardContent>
      </Card>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-zo-chrome text-base">Automation & Qualification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Automation status" value={partner.automation_status} />
            <Field label="Automation source" value={partner.automation_source} />
            <Field label="AI score" value={partner.ai_score} />
            <Field label="Workflow ID" value={partner.n8n_workflow_id} />
          </div>
          {partner.ai_summary && (
            <div className="text-sm border-t border-border pt-3">
              <span className="text-muted-foreground">AI summary:</span> {partner.ai_summary}
            </div>
          )}
          {partner.qualification_notes && (
            <div className="text-sm border-t border-border pt-3">
              <span className="text-muted-foreground">Qualification notes:</span> {partner.qualification_notes}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
