import { NextResponse } from 'next/server'
import { INTERNAL_ROLES, type Role } from '@/types'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SubscriptionBody = {
  endpoint?: unknown
  keys?: {
    p256dh?: unknown
    auth?: unknown
  }
  deviceLabel?: unknown
}

async function authorizeInternalUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    return { response: NextResponse.json({ error: 'Profile lookup failed' }, { status: 500 }) }
  }

  if (!profile || profile.status !== 'active' || !INTERNAL_ROLES.includes(profile.role as Role)) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { supabase, user }
}

async function readBody(request: Request): Promise<SubscriptionBody | null> {
  try {
    return await request.json() as SubscriptionBody
  } catch {
    return null
  }
}

function nonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export async function POST(request: Request) {
  const authorized = await authorizeInternalUser()
  if ('response' in authorized) return authorized.response

  const body = await readBody(request)
  const endpoint = nonEmptyString(body?.endpoint)
  const p256dh = nonEmptyString(body?.keys?.p256dh)
  const auth = nonEmptyString(body?.keys?.auth)
  const deviceLabel = nonEmptyString(body?.deviceLabel)

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Invalid push subscription' }, { status: 400 })
  }

  const { supabase, user } = authorized
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint,
    p256dh,
    auth,
    user_agent: request.headers.get('user-agent'),
    device_label: deviceLabel,
    is_active: true,
  }, { onConflict: 'endpoint' })

  if (error) {
    console.error('[push-subscription] Save failed', { code: error.code })
    return NextResponse.json({ error: 'Subscription save failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const authorized = await authorizeInternalUser()
  if ('response' in authorized) return authorized.response

  const body = await readBody(request)
  const endpoint = nonEmptyString(body?.endpoint)

  if (!endpoint) {
    return NextResponse.json({ error: 'Invalid push subscription' }, { status: 400 })
  }

  const { supabase, user } = authorized
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_active: false })
    .eq('endpoint', endpoint)
    .eq('user_id', user.id)

  if (error) {
    console.error('[push-subscription] Disable failed', { code: error.code })
    return NextResponse.json({ error: 'Subscription disable failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
