import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

type SupabaseLike = SupabaseClient

export type GoogleCalendarEventInput = {
  title: string
  scheduled_at: string
  duration_minutes: number
  attendees: string[]
  agenda: string | null
  notes: string | null
  meeting_link: string | null
}

export type GoogleCalendarEventResult = {
  calendarEventId: string
  meetingLink: string | null
}

function isEmailAttendee(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function getGoogleCalendarAccessToken(supabase: SupabaseLike, userId: string) {
  const { data: tokenRow, error } = await supabase
    .from('google_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!tokenRow) throw new Error('Connect Google Calendar before creating Google meetings.')

  if (new Date(tokenRow.expires_at) > new Date()) {
    return tokenRow.access_token
  }

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
    throw new Error('Token refresh failed. Reconnect Google Calendar.')
  }

  const refreshed = await refreshRes.json()
  await supabase
    .from('google_tokens')
    .update({
      access_token: refreshed.access_token,
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    })
    .eq('user_id', userId)

  return refreshed.access_token as string
}

export async function createGoogleCalendarEvent(
  supabase: SupabaseLike,
  userId: string,
  input: GoogleCalendarEventInput,
): Promise<GoogleCalendarEventResult> {
  const accessToken = await getGoogleCalendarAccessToken(supabase, userId)
  const start = new Date(input.scheduled_at)
  if (Number.isNaN(start.getTime())) throw new Error('Scheduled time must be a valid date.')

  const end = new Date(start.getTime() + input.duration_minutes * 60000)
  const description = [input.agenda, input.notes].filter(Boolean).join('\n\n') || undefined

  const createRes = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?' +
      new URLSearchParams({ conferenceDataVersion: '1', sendUpdates: 'all' }),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: input.title,
        description,
        location: input.meeting_link || undefined,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        attendees: input.attendees.filter(isEmailAttendee).map(email => ({ email })),
        conferenceData: input.meeting_link
          ? undefined
          : { createRequest: { requestId: `zeroorigins-${crypto.randomUUID()}` } },
      }),
    },
  )

  if (!createRes.ok) {
    const details = await createRes.text()
    throw new Error(`Failed to create Google Calendar event. ${details}`)
  }

  const event = await createRes.json()
  return {
    calendarEventId: event.id,
    meetingLink: event.hangoutLink || event.htmlLink || input.meeting_link,
  }
}
