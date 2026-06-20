import { AiAssistPanel } from '@/components/ai/AiAssistPanel'
import { InternalHeader } from '@/components/layout/internal-header'
import { InternalSidebar } from '@/components/layout/internal-sidebar'
import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/types'

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user?.id || '')
    .single()

  const role = profile?.role as Role | undefined
  const { data: notifications } = user
    ? await supabase
      .from('notification_events')
      .select('id, title, message, severity, status, action_url, created_at')
      .eq('user_id', user.id)
      .neq('status', 'dismissed')
      .order('status', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10)
    : { data: [] }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <InternalSidebar role={role} />
      <div className="min-h-screen lg:pl-64">
        <InternalHeader email={user?.email} fullName={profile?.full_name} role={role} notifications={notifications ?? []} />
        <main className="mx-auto max-w-screen-2xl px-3 py-4 sm:px-4 sm:py-6 md:px-6">
          {children}
        </main>
      </div>
      <AiAssistPanel />
    </div>
  )
}
