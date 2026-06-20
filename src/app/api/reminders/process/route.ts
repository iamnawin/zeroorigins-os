import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { processDueReminders } from '@/lib/notifications/reminders'

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
