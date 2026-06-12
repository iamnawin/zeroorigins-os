'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CALENDAR_PROVIDERS,
  CALENDAR_SYNC_STATUSES,
  INTERNAL_ROLES,
  PROFILE_STATUSES,
  type CalendarProvider,
  type CalendarSyncStatus,
  type Profile,
  type ProfileStatus,
  type Role,
} from '@/types'
import { updateTeamProfile } from '@/lib/actions/internal-resources'

type InternalRole = Extract<Role, 'admin' | 'employee'>

interface Props {
  profile: Profile
  currentUserId: string
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ')
}

export default function TeamProfileForm({ profile, currentUserId }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    title: profile.title ?? '',
    role: (profile.role === 'admin' ? 'admin' : 'employee') as InternalRole,
    status: profile.status ?? 'pending',
    calendar_email: profile.calendar_email ?? profile.email ?? '',
    calendar_provider: profile.calendar_provider ?? 'none',
    calendar_sync_enabled: Boolean(profile.calendar_sync_enabled),
    calendar_sync_status: profile.calendar_sync_status ?? 'not_connected',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target instanceof HTMLInputElement && event.target.type === 'checkbox'
      ? event.target.checked
      : event.target.value
    setForm(current => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const result = await updateTeamProfile(profile.id, {
      full_name: form.full_name,
      title: form.title,
      role: form.role,
      status: form.status as ProfileStatus,
      calendar_email: form.calendar_email,
      calendar_provider: form.calendar_provider as CalendarProvider,
      calendar_sync_enabled: form.calendar_sync_enabled,
      calendar_sync_status: form.calendar_sync_status as CalendarSyncStatus,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.refresh()
    setLoading(false)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-zo-chrome">{profile.email}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{profile.title || 'Internal team member'}</p>
          </div>
          <div className="flex items-center gap-2">
            {profile.id === currentUserId && <Badge variant="outline">you</Badge>}
            <Badge variant={profile.status === 'active' ? 'default' : 'outline'}>{formatLabel(profile.status)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={set('full_name')} required />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={set('title')} placeholder="Founder, Admin, Operator" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select value={form.role} onChange={set('role')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {INTERNAL_ROLES.map(role => <option key={role} value={role}>{formatLabel(role)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={form.status} onChange={set('status')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {PROFILE_STATUSES.map(status => <option key={status} value={status}>{formatLabel(status)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Calendar Email</Label>
              <Input value={form.calendar_email} onChange={set('calendar_email')} placeholder="name@zeroorigins.in" />
            </div>
            <div className="space-y-2">
              <Label>Calendar Provider</Label>
              <select value={form.calendar_provider} onChange={set('calendar_provider')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {CALENDAR_PROVIDERS.map(provider => <option key={provider} value={provider}>{formatLabel(provider)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Sync Status</Label>
              <select value={form.calendar_sync_status} onChange={set('calendar_sync_status')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {CALENDAR_SYNC_STATUSES.map(status => <option key={status} value={status}>{formatLabel(status)}</option>)}
              </select>
            </div>
            <label className="flex min-h-10 items-center gap-3 rounded-md border border-border px-3 text-sm">
              <input type="checkbox" checked={form.calendar_sync_enabled} onChange={set('calendar_sync_enabled')} />
              Calendar sync ready
            </label>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
