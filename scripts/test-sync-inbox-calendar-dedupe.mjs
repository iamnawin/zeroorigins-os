import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { SENTINELS } from './lib/migration-sentinels.mjs'

const repoRoot = path.resolve(import.meta.dirname, '..')
const syncInboxMigrationSuffix = '_sync_inbox_calendar_dedupe.sql'

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath))
}

function findMigrationBySuffix(suffix) {
  const migrationDir = path.join(repoRoot, 'supabase/migrations')
  const candidates = fs
    .readdirSync(migrationDir)
    .filter(fileName => fileName.endsWith(suffix))
    .sort()

  assert.ok(candidates.length > 0, `Expected a migration ending with ${suffix}`)
  assert.equal(candidates.length, 1, `Expected exactly one migration ending with ${suffix}`)
  return `supabase/migrations/${candidates[0]}`
}

test('sync inbox migration creates signal and meeting link tables', () => {
  const migration = read(findMigrationBySuffix(syncInboxMigrationSuffix))

  assert.match(migration, /create table if not exists sync_signals/)
  assert.match(migration, /source_provider text not null/)
  assert.match(migration, /source_account_type text not null/)
  assert.match(migration, /source_object_id text not null/)
  assert.match(migration, /payload jsonb not null default '\{\}'::jsonb/)
  assert.match(migration, /status text not null default 'new'/)
  assert.match(migration, /suggested_record_type text/)
  assert.match(migration, /suggested_vertical_id uuid references business_verticals/)
  assert.match(migration, /create table if not exists meeting_sync_links/)
  assert.match(migration, /meeting_id uuid not null references meetings/)
  assert.match(migration, /sync_signal_id uuid not null references sync_signals/)
  assert.match(migration, /unique \(source_provider, source_account_id, source_object_id\)/)
})

test('migration sentinels cover sync inbox tables', () => {
  for (const expected of [
    { table: 'sync_signals', column: 'source_provider' },
    { table: 'sync_signals', column: 'source_account_type' },
    { table: 'sync_signals', column: 'source_object_id' },
    { table: 'sync_signals', column: 'status' },
    { table: 'meeting_sync_links', column: 'meeting_id' },
    { table: 'meeting_sync_links', column: 'sync_signal_id' },
  ]) {
    assert.ok(
      SENTINELS.some(sentinel =>
        sentinel.migration.endsWith('_sync_inbox_calendar_dedupe') &&
        sentinel.table === expected.table &&
        sentinel.column === expected.column
      ),
      `Missing sentinel for ${expected.table}.${expected.column}`,
    )
  }
})

test('calendar dedupe helper exposes source priority and match helpers', () => {
  const helperPath = 'src/lib/sync/calendar-dedupe.ts'
  assert.ok(exists(helperPath), 'calendar dedupe helper should exist')
  const helper = read(helperPath)

  assert.match(helper, /export function classifyCalendarAccount/)
  assert.match(helper, /admin@zeroorigins\.in|ADMIN_EMAILS/)
  assert.match(helper, /support@zeroorigins\.in|SUPPORT_EMAILS|startsWith\('support@'\)/)
  assert.match(helper, /export function normalizeCalendarEvent/)
  assert.match(helper, /attendees[\s\S]{0,240}\.toLowerCase\(\)[\s\S]{0,120}\.trim\(\)|attendees[\s\S]{0,240}\.trim\(\)[\s\S]{0,120}\.toLowerCase\(\)/)
  assert.match(helper, /end\.getTime\(\)\s*-\s*start\.getTime\(\)/)
  assert.match(helper, /\/\s*60000/)
  assert.match(helper, /export function buildCalendarDedupeKey/)
  assert.match(helper, /iCalUID[\s\S]{0,120}return/)
  assert.match(helper, /recurringEventId[\s\S]{0,160}return/)
  assert.match(helper, /meetingLink[\s\S]{0,160}return/)
  assert.match(helper, /export function scoreCalendarMeetingMatch/)
  assert.match(helper, /confidence:\s*1\b/)
  assert.match(helper, /confidence:\s*0\.95\b/)
  assert.match(helper, /confidence:\s*0\.9\b/)
  assert.match(helper, /calendar_event_id|meeting_link|title_time_attendees/)
  assert.match(helper, /export function shouldAutoCreateMeeting/)
  assert.match(helper, /accountType\s*===\s*'admin'[\s\S]{0,120}accountType\s*===\s*'support'|accountType\s*===\s*'support'[\s\S]{0,120}accountType\s*===\s*'admin'/)
  assert.match(helper, /confidence\s*>=\s*0\.75/)
})

test('calendar sync route stores raw signals before writing meetings', () => {
  const route = read('src/app/api/calendar/sync/route.ts')

  assert.match(route, /from\('sync_signals'\)/)
  assert.match(route, /from\('meeting_sync_links'\)/)
  assert.match(route, /classifyCalendarAccount/)
  assert.match(route, /normalizeCalendarEvent/)
  assert.match(route, /scoreCalendarMeetingMatch/)
  assert.match(route, /shouldAutoCreateMeeting/)
  assert.match(route, /status:\s*'needs_review'/)
  assert.match(route, /status:\s*'created'/)
  assert.doesNotMatch(route, /\.from\('meetings'\)[\s\S]*?\.eq\('calendar_event_id', event\.id\)[\s\S]*?\.eq\('owner_id', user\.id\)/)
})

test('sync inbox page lists reviewable signals and source context', () => {
  const pagePath = 'src/app/(internal)/internal/sync-inbox/page.tsx'
  assert.ok(exists(pagePath), 'Sync Inbox page should exist')

  const page = read(pagePath)
  assert.match(page, /sync_signals/)
  assert.match(page, /needs_review/)
  assert.match(page, /source_account_type/)
  assert.match(page, /suggested_record_type/)
  assert.match(page, /ZeroOrigins Sync Inbox|Sync Inbox/)
})
