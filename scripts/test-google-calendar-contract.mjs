import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath))
}

test('Google Calendar sync writes only columns and values accepted by meetings schema', () => {
  const route = read('src/app/api/calendar/sync/route.ts')
  const button = read('src/components/calendar/sync-calendar-button.tsx')

  assert.match(route, /source:\s*'google_calendar'/)
  assert.doesNotMatch(route, /source:\s*'google'/)
  assert.match(route, /sync_status:\s*'ready'/)
  assert.doesNotMatch(route, /sync_status:\s*'synced'/)
  assert.doesNotMatch(route, /\bends_at\b/)
  assert.doesNotMatch(route, /\bdescription:\s*event\.description/)
  assert.match(route, /agenda:\s*event\.description/)
  assert.doesNotMatch(route, /\.maybeSingle\(\)/)
  assert.match(route, /\.limit\(1\)/)
  assert.match(button, /data\.details/)
})

test('Google Calendar OAuth requests event write access and records profile readiness', () => {
  const authRoute = read('src/app/api/auth/google/route.ts')
  const callbackRoute = read('src/app/api/auth/google/callback/route.ts')

  assert.match(authRoute, /https:\/\/www\.googleapis\.com\/auth\/calendar\.events/)
  assert.match(callbackRoute, /calendar_provider:\s*'google'/)
  assert.match(callbackRoute, /calendar_sync_enabled:\s*true/)
  assert.match(callbackRoute, /calendar_sync_status:\s*'ready'/)
})

test('meeting server action creates a Google event when Google Calendar source is selected', () => {
  const actions = read('src/lib/actions/internal-resources.ts')
  assert.ok(exists('src/lib/google/calendar.ts'), 'Google Calendar helper should exist')

  const googleCalendar = read('src/lib/google/calendar.ts')

  assert.match(actions, /createGoogleCalendarEvent/)
  assert.match(actions, /payload\.source === 'google_calendar'/)
  assert.match(actions, /payload\.calendar_event_id = googleEvent\.calendarEventId/)
  assert.match(actions, /payload\.meeting_link = googleEvent\.meetingLink/)
  assert.match(googleCalendar, /conferenceDataVersion/)
  assert.match(googleCalendar, /sendUpdates/)
})
