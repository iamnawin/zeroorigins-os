import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CalendarPlus } from 'lucide-react'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { CrmActionButton } from '@/components/internal/crm-action-button'
import type { Customer } from '@/types'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span> {value ?? '—'}
    </div>
  )
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('customers').select('*').eq('id', id).single()
  if (!data) notFound()
  const customer = data as Customer

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id || '').single()
  const isAdmin = profile?.role === 'admin'

  const [{ data: sourceLead }, { data: projects }] = await Promise.all([
    customer.lead_id
      ? supabase.from('leads').select('id, name, status').eq('id', customer.lead_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('projects').select('id, title, status').eq('customer_id', id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/internal/customers">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        </Link>
        <div className="flex gap-2">
          <CrmActionButton
            label="Create Project"
            action="createProjectFromCustomer"
            resourceId={id}
            redirectTo={projectId => `/internal/projects/${projectId}`}
          />
          <Link href={`/internal/meetings/new?customer_id=${id}`}>
            <Button size="sm" variant="outline"><CalendarPlus className="w-4 h-4 mr-1" />Meeting</Button>
          </Link>
          {isAdmin && (
            <Link href={`/internal/customers/${id}/edit`}>
              <Button size="sm" variant="outline">Edit</Button>
            </Link>
          )}
        </div>
      </div>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zo-chrome">{customer.name}</CardTitle>
            <Badge>{customer.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Email" value={customer.email} />
            <Field label="Company" value={customer.company} />
            <Field label="Phone" value={customer.phone} />
            <Field label="Website" value={customer.website} />
            <Field
              label="Customer since"
              value={new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            />
            <div>
              <span className="text-muted-foreground">Source lead:</span>{' '}
              {sourceLead ? (
                <Link href={`/internal/leads/${sourceLead.id}`} className="text-zo-purple-2 hover:underline">
                  {sourceLead.name}
                </Link>
              ) : '—'}
            </div>
          </div>
          {customer.notes && <p className="text-sm text-muted-foreground border-t border-border pt-3 mt-3">{customer.notes}</p>}
        </CardContent>
      </Card>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-zo-chrome text-base">Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projects && projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map(p => (
                <Link key={p.id} href={`/internal/projects/${p.id}`} className="flex items-center justify-between rounded-md border border-border p-3 hover:border-zo-purple/30 transition-colors">
                  <span className="text-sm font-medium text-foreground">{p.title}</span>
                  <ResourceStatusBadge status={p.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No projects linked to this customer yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
