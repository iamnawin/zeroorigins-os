import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/internal/meetings?error=no_code', request.url))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = process.env.GOOGLE_REDIRECT_URI!

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/internal/meetings?error=token_exchange_failed', request.url))
  }

  const tokens = await tokenRes.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: existingToken } = await supabase
    .from('google_tokens')
    .select('refresh_token')
    .eq('user_id', user.id)
    .maybeSingle()

  const refreshToken = tokens.refresh_token ?? existingToken?.refresh_token
  if (!refreshToken) {
    return NextResponse.redirect(new URL('/internal/meetings?error=no_refresh_token', request.url))
  }

  const { error } = await supabase.from('google_tokens').upsert({
    user_id: user.id,
    access_token: tokens.access_token,
    refresh_token: refreshToken,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    scope: tokens.scope,
  }, { onConflict: 'user_id' })

  if (error) {
    return NextResponse.redirect(new URL('/internal/meetings?error=save_failed', request.url))
  }

  await supabase
    .from('profiles')
    .update({
      calendar_email: user.email,
      calendar_provider: 'google',
      calendar_sync_enabled: true,
      calendar_sync_status: 'ready',
    })
    .eq('id', user.id)

  return NextResponse.redirect(new URL('/internal/meetings?connected=true', request.url))
}
