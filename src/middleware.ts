import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { INTERNAL_ROLES, type Role } from '@/types'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Public routes
  if (pathname.startsWith('/request-build') || pathname.startsWith('/partner-with-us')) {
    return supabaseResponse
  }

  // Auth routes
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password')) {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const role = profile?.role as Role
      if (INTERNAL_ROLES.includes(role)) {
        return NextResponse.redirect(new URL('/internal/control-room', request.url))
      }
      if (role === 'PARTNER' || role === 'REFERRAL_PARTNER') {
        return NextResponse.redirect(new URL('/portal/partner/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/portal/customer/dashboard', request.url))
    }
    return supabaseResponse
  }

  // Protected routes
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'CUSTOMER') as Role

  if (pathname.startsWith('/internal')) {
    if (!INTERNAL_ROLES.includes(role)) {
      if (role === 'PARTNER' || role === 'REFERRAL_PARTNER') {
        return NextResponse.redirect(new URL('/portal/partner/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/portal/customer/dashboard', request.url))
    }
  }

  if (pathname.startsWith('/portal/customer')) {
    const allowed = INTERNAL_ROLES.includes(role) || role === 'CUSTOMER'
    if (!allowed) {
      return NextResponse.redirect(new URL('/portal/partner/dashboard', request.url))
    }
  }

  if (pathname.startsWith('/portal/partner')) {
    const allowed = INTERNAL_ROLES.includes(role) || role === 'PARTNER' || role === 'REFERRAL_PARTNER'
    if (!allowed) {
      return NextResponse.redirect(new URL('/portal/customer/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
