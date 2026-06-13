import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type SupabaseErrorLike = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get stored tokens
  const { data: tokenRow } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!tokenRow) {
    return NextResponse.json({ error: 'Google Calendar not connected. Connect first.' }, { status: 400 })
  }

  let accessToken = tokenRow.access_token

  // Refresh if expired
  if (new Date(tokenRow.expires_at) < new Date()) {
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: tokenRow.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!refreshRes.ok) {
      return NextResponse.json({ error: 'Token refresh failed. Reconnect Google Calendar.' }, { status: 401 })
    }

    const refreshed = await refreshRes.json()
    accessToken = refreshed.access_token

    await supabase.from('google_tokens').update({
      access_token: refreshed.access_token,
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    }).eq('user_id', user.id)
  }

  // Fetch calendar events (next 30 days)
  const now = new Date()
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100',
    }),
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!calRes.ok) {
    const err = await calRes.text()
    return NextResponse.json({ error: 'Failed to fetch calendar', details: err }, { status: 500 })
  }

  const calData = await calRes.json()
  const events = calData.items || []

  let created = 0
  let updated = 0

  for (const event of events) {
    if (!event.summary) continue

    const startTime = event.start?.dateTime || event.start?.date
    const endTime = event.end?.dateTime || event.end?.date
    if (!startTime) continue

    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : null
    const durationMinutes = end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
      ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
      : 30

    const meetingData = {
      title: event.summary,
      scheduled_at: startTime,
      duration_minutes: durationMinutes,
      attendees: (event.attendees ?? [])
        .map((attendee: { email?: string }) => attendee.email)
        .filter(Boolean),
      agenda: event.description || null,
      meeting_link: event.hangoutLink || event.location || null,
      source: 'google_calendar' as const,
      calendar_event_id: event.id,
      sync_status: 'ready' as const,
      status: 'scheduled',
      owner_id: user.id,
    }

    let syncColumnsAvailable = true
    const lookupResult = await supabase
      .from('meetings')
      .select('id')
      .eq('calendar_event_id', event.id)
      .eq('owner_id', user.id)
      .limit(1)
    let existingRows = lookupResult.data
    const lookupError = lookupResult.error

    if (lookupError) {
      if (!isMissingMeetingSyncColumnError(lookupError)) {
        return NextResponse.json({ error: 'Failed to check existing calendar event', details: lookupError.message }, { status: 500 })
      }

      syncColumnsAvailable = false
      const fallback = await supabase
        .from('meetings')
        .select('id')
        .eq('title', meetingData.title)
        .eq('scheduled_at', meetingData.scheduled_at)
        .eq('owner_id', user.id)
        .limit(1)

      if (fallback.error) {
        return NextResponse.json({ error: 'Failed to check existing calendar event', details: fallback.error.message }, { status: 500 })
      }
      existingRows = fallback.data
    }

    const existing = existingRows?.[0]
    const rowData = syncColumnsAvailable ? meetingData : legacyMeetingData(meetingData)

    if (existing) {
      const { error } = await supabase.from('meetings').update(rowData).eq('id', existing.id)
      if (error) {
        return NextResponse.json({ error: 'Failed to update synced meeting', details: error.message }, { status: 500 })
      }
      updated++
    } else {
      const { error } = await supabase.from('meetings').insert({
        ...rowData,
        created_by: user.id,
      })
      if (error) {
        return NextResponse.json({ error: 'Failed to save synced meeting', details: error.message }, { status: 500 })
      }
      created++
    }
  }

  return NextResponse.json({ success: true, created, updated, total: events.length })
}

function legacyMeetingData(input: {
  title: string
  scheduled_at: string
  duration_minutes: number
  attendees: string[]
  agenda: string | null
  status: string
  owner_id: string
}) {
  return {
    title: input.title,
    scheduled_at: input.scheduled_at,
    duration_minutes: input.duration_minutes,
    attendees: input.attendees,
    agenda: input.agenda,
    status: input.status,
    owner_id: input.owner_id,
  }
}

function isMissingMeetingSyncColumnError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const typed = error as SupabaseErrorLike
  const message = `${typed.code ?? ''} ${typed.message ?? ''} ${typed.details ?? ''} ${typed.hint ?? ''}`.toLowerCase()
  return (
    message.includes('meetings.source') ||
    message.includes('meetings.calendar_event_id') ||
    message.includes('meetings.meeting_link') ||
    message.includes('meetings.notes') ||
    message.includes('meetings.sync_status') ||
    message.includes("column 'source'") ||
    message.includes("column 'calendar_event_id'") ||
    message.includes("column 'meeting_link'") ||
    message.includes("column 'notes'") ||
    message.includes("column 'sync_status'") ||
    message.includes('schema cache')
  )
}
