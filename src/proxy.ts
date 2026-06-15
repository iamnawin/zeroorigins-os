import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { INTERNAL_ROLES, EXTERNAL_ROLES, type Role } from '@/types'

const KNOWN_ROLES: Role[] = [...INTERNAL_ROLES, ...EXTERNAL_ROLES]

const INTERNAL_EMAIL_DOMAIN = "@zeroorigins.in";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public routes — skip Supabase entirely
  if (pathname.startsWith('/request-build') || pathname.startsWith('/partner-with-us')) {
    return NextResponse.next()
  }

  // Gateway and auth routes never need a user lookup — answering them without
  // the Supabase round-trip keeps `/` and `/login` interactions instant.
  if (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/callback')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes handling
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Fetch role with safe default
  let role: Role = 'CUSTOMER'
  let profileStatus = 'active'
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .maybeSingle() // Use maybeSingle to avoid error if missing

    if (profile?.role) {
      // Legacy/unknown roles (e.g. pre-simplification FOUNDER/SUPER_ADMIN) must
      // never enter the portal redirect chain — they would ping-pong between
      // the customer and partner portals forever (ERR_TOO_MANY_REDIRECTS).
      if (!KNOWN_ROLES.includes(profile.role as Role)) {
        return NextResponse.redirect(new URL('/login?error=invalid_role', request.url))
      }
      role = profile.role as Role
    }
    if (profile?.status) {
      profileStatus = profile.status
    }
  } catch (err) {
    console.error('Proxy profile fetch error:', err)
  }

  const email = user.email?.toLowerCase() || ""
  const hasInternalDomain = email.endsWith(INTERNAL_EMAIL_DOMAIN)
  const hasInternalRole = INTERNAL_ROLES.includes(role)

  // 1. Internal Route Protection (/internal/*)
  if (pathname.startsWith('/internal')) {
    // A. Invalid Domain
    if (!hasInternalDomain) {
      if (role === 'PARTNER' || role === 'REFERRAL_PARTNER') {
        return NextResponse.redirect(new URL('/portal/partner/dashboard?message=unauthorized_internal', request.url))
      }
      return NextResponse.redirect(new URL('/portal/customer/dashboard?message=unauthorized_internal', request.url))
    }

    // B. Correct Domain but No Internal Role
    if (!hasInternalRole) {
      return NextResponse.redirect(new URL('/portal/customer/dashboard?message=pending_approval', request.url))
    }

    // C. Internal role but profile not active yet
    if (profileStatus !== 'active') {
      return NextResponse.redirect(new URL('/login?error=pending_approval', request.url))
    }
  }

  // 2. Customer Portal Protection
  if (pathname.startsWith('/portal/customer')) {
    const allowed = INTERNAL_ROLES.includes(role) || role === 'CUSTOMER'
    if (!allowed) {
      return NextResponse.redirect(new URL('/portal/partner/dashboard', request.url))
    }
  }

  // 3. Partner Portal Protection
  if (pathname.startsWith('/portal/partner')) {
    const allowed = INTERNAL_ROLES.includes(role) || role === 'PARTNER' || role === 'REFERRAL_PARTNER'
    if (!allowed) {
      return NextResponse.redirect(new URL('/portal/customer/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
