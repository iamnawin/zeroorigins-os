import { InternalSidebar } from '@/components/layout/internal-sidebar'
import { InternalHeader } from '@/components/layout/internal-header'
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
    <div className="min-h-screen bg-[#050505]">
      <InternalSidebar role={role} />
      <div className="ml-60">
        <InternalHeader email={user?.email} role={role} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
