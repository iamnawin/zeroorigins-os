import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect address
  const next = searchParams.get('next') ?? '/'

  if (code) {
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
            } catch {}
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!authError && user) {
      // 1. Profile Self-Healing: Ensure profile exists
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()
        
        if (!profile) {
          console.log('Self-healing profile for callback user:', user.email)
          const email = user.email?.toLowerCase() ?? ''
          const defaultRole = email.endsWith('@zeroorigins.in') ? 'employee' : 'CUSTOMER'
          const profilePayload = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            role: defaultRole,
            status: 'active',
          }

          const { error: selfHealError } = await supabase.from('profiles').insert(profilePayload)

          if (selfHealError && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const serviceRoleClient = createServerClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY,
              {
                cookies: {
                  getAll() { return cookieStore.getAll() },
                  setAll() {}
                },
              }
            )
            await serviceRoleClient.from('profiles').insert(profilePayload)
          } else if (selfHealError) {
            console.error('Profile callback self-heal failed:', selfHealError)
          }
        }
      } catch (err) {
        console.error('Profile check/healing error in callback:', err)
        // We continue anyway, as the user is at least authenticated
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
