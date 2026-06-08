'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function ensureProfile() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Check if profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) return { success: true, role: profile.role }

    // Profile missing — self-heal. @zeroorigins.in → employee, all others → CUSTOMER.
    const defaultRole = user.email?.endsWith('@zeroorigins.in') ? 'employee' : 'CUSTOMER'
    const insertRow = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      role: defaultRole as 'employee' | 'CUSTOMER',
    }

    // Preferred path: insert with the authenticated client (requires the
    // "Users can insert own profile" RLS policy from migration 004).
    const { error: insertError } = await supabase.from('profiles').insert(insertRow)
    if (!insertError) return { success: true, role: defaultRole }

    // Fallback: service role, only if configured (never required).
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceKey) {
      const cookieStore = await cookies()
      const admin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
      )
      const { error: adminError } = await admin.from('profiles').insert(insertRow)
      if (!adminError) return { success: true, role: defaultRole }
      console.error('Service-role profile self-heal failed:', adminError)
      return { success: false, error: adminError.message }
    }

    console.error('Profile self-heal failed (no RLS insert policy and no service role key):', insertError)
    return { success: false, error: insertError.message }
  } catch (err) {
    console.error('ensureProfile unexpected error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}


export async function signOut() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
  await supabase.auth.signOut()
  redirect('/login')
}
