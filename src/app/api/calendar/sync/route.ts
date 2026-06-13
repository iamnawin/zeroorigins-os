import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const meetingData = {
      title: event.summary,
      description: event.description || null,
      scheduled_at: startTime,
      ends_at: endTime || null,
      meeting_link: event.hangoutLink || event.location || null,
      source: 'google' as const,
      calendar_event_id: event.id,
      sync_status: 'synced' as const,
      status: 'scheduled',
      owner_id: user.id,
    }

    // Upsert by calendar_event_id
    const { data: existing } = await supabase
      .from('meetings')
      .select('id')
      .eq('calendar_event_id', event.id)
      .single()

    if (existing) {
      await supabase.from('meetings').update(meetingData).eq('id', existing.id)
      updated++
    } else {
      await supabase.from('meetings').insert(meetingData)
      created++
    }
  }

  return NextResponse.json({ success: true, created, updated, total: events.length })
}
