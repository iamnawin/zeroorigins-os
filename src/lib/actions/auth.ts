'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function ensureProfile() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {}
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile) return { success: true, role: profile.role }

  // Create missing profile using service role
  const serviceRoleClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {}
      },
    }
  )

  const { error } = await serviceRoleClient
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      role: 'CUSTOMER'
    })

  if (error) {
    console.error('Self-healing profile creation failed:', error)
    return { success: false, error }
  }

  return { success: true, role: 'CUSTOMER' }
}

export async function promoteToFounder() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if any founder already exists
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('role', ['FOUNDER', 'SUPER_ADMIN'])

  if (count && count > 0) {
    throw new Error('A Founder account already exists. Promotion disabled.')
  }

  // Use a service role client to bypass RLS for this one-time bootstrap
  // Note: We need SUPABASE_SERVICE_ROLE_KEY for this.
  const serviceRoleClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for bootstrap
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {}
      },
    }
  )

  const { error } = await serviceRoleClient
    .from('profiles')
    .update({ 
      role: 'FOUNDER',
      full_name: 'Naveen'
    })
    .eq('id', user.id)

  if (error) throw error

  revalidatePath('/')
  revalidatePath('/setup-founder')
  revalidatePath('/portal/customer/dashboard')
  
  return { success: true }
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
