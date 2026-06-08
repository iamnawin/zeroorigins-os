import { InternalTopNav } from '@/components/layout/internal-topnav'
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
      <InternalTopNav email={user?.email} fullName={profile?.full_name} role={role} />
      <main className="pt-12 max-w-screen-2xl mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  )
}
