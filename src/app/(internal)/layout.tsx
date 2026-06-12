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

  return (
    <div className="min-h-screen bg-background">
      <InternalSidebar role={role} />
      <div className="min-h-screen lg:pl-64">
        <InternalHeader email={user?.email} fullName={profile?.full_name} role={role} />
        <main className="mx-auto max-w-screen-2xl px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
      <AiAssistPanel />
    </div>
  )
}
