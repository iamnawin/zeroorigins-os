import { Users, UserCheck, UserMinus, UserRoundCog } from 'lucide-react'
import TeamProfileForm from '@/components/forms/TeamProfileForm'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-zo-purple" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-zo-chrome">{value}</p>
      </CardContent>
    </Card>
  )
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('id, role, status')
    .eq('id', user?.id ?? '')
    .single()

  if (currentProfile?.role !== 'admin') {
    return (
      <div className="space-y-5">
        <div>
          <Badge variant="outline">settings</Badge>
          <h1 className="mt-3 text-2xl font-semibold text-zo-chrome">Team Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Team roles and calendar identity are managed by admins.</p>
        </div>
      </div>
    )
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, title, status, calendar_email, calendar_provider, calendar_sync_enabled, calendar_sync_status, avatar_url, organization_id, created_at, updated_at')
    .in('role', ['admin', 'employee'])
    .order('status', { ascending: true })
    .order('email', { ascending: true })

  const rows = (profiles ?? []) as Profile[]
  const active = rows.filter(row => row.status === 'active').length
  const pending = rows.filter(row => row.status === 'pending').length
  const disabled = rows.filter(row => row.status === 'disabled').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant="outline">internal team</Badge>
          <h1 className="mt-3 text-2xl font-semibold text-zo-chrome">Team Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Internal users, roles, profile status, and calendar identity for first-party scheduling.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Active" value={active} icon={UserCheck} />
        <StatCard label="Pending" value={pending} icon={UserRoundCog} />
        <StatCard label="Disabled" value={disabled} icon={UserMinus} />
      </div>

      <div className="grid gap-4">
        {rows.map(profile => (
          <TeamProfileForm key={profile.id} profile={profile} currentUserId={user?.id ?? ''} />
        ))}
        {rows.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent>
              <p className="text-sm text-muted-foreground">No internal profiles found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
