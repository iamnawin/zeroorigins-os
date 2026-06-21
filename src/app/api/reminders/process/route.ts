import { NextResponse, type NextRequest } from 'next/server'
import { INTERNAL_ROLES, type Role } from '@/types'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient as createAuthenticatedClient } from '@/lib/supabase/server'
import { processDueReminders } from '@/lib/notifications/reminders'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  const Authorization = request.headers.get('Authorization')
  const bearer = Authorization?.startsWith('Bearer ') ? Authorization.slice('Bearer '.length).trim() : null
  const querySecret = request.nextUrl.searchParams.get('secret')

  if (!secret || (bearer !== secret && querySecret !== secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const result = await processDueReminders(supabase)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[reminders] Processing failed', error)
    return NextResponse.json({ error: 'Reminder processing failed' }, { status: 500 })
  }
}

export async function POST() {
  const auth = await createAuthenticatedClient()
  const { data: { user } } = await auth.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await auth
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.status !== 'active' || !INTERNAL_ROLES.includes(profile.role as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const supabase = createServiceClient()
    const result = await processDueReminders(supabase)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[reminders] Processing failed', error)
    return NextResponse.json({ error: 'Reminder processing failed' }, { status: 500 })
  }
}
