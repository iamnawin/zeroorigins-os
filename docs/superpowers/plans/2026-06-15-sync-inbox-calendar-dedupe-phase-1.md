# Sync Inbox Calendar Dedupe Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 1 Sync Inbox foundation that stores raw Google Calendar signals, dedupes admin/support/personal calendar events into one canonical meeting, and routes personal-only events to review.

**Architecture:** Add generic `sync_signals` plus `meeting_sync_links` tables, then move calendar matching logic into focused server-only helpers under `src/lib/sync/`. The calendar sync route should ingest raw Google events, classify source priority from the connected profile, match existing meetings by source link/event/link/time/title/attendees, and only create canonical meetings automatically for trusted admin/support calendars.

**Tech Stack:** Next.js 16 App Router route handlers, Supabase Postgres/RLS, Supabase SSR server client, TypeScript, Node test runner contract tests.

---

## Scope

This plan implements only Phase 1 from [2026-06-15-zeroorigins-sync-inbox-design.md](../specs/2026-06-15-zeroorigins-sync-inbox-design.md):

- raw calendar signal storage
- meeting-to-signal links
- admin/support source priority
- calendar sync dedupe before insert
- personal-calendar-only review queue
- small internal Sync Inbox page
- contract tests and migration sentinels

This plan intentionally excludes Google Drive, Gmail, finance provider sync, YouTube/content sync, and AI classification UI.

## File Structure

- Create `supabase/migrations/018_sync_inbox_calendar_dedupe.sql`
  - Defines `sync_signals`, `meeting_sync_links`, constraints, indexes, and RLS.
- Modify `scripts/lib/migration-sentinels.mjs`
  - Adds sentinel checks for the new sync tables and fields.
- Create `scripts/test-sync-inbox-calendar-dedupe.mjs`
  - Contract tests for schema, route behavior, helper boundaries, and review inbox.
- Modify `package.json`
  - Adds `test:sync-inbox-calendar`.
- Modify `src/types/index.ts`
  - Adds sync source/status/type constants and interfaces.
- Create `src/lib/sync/calendar-dedupe.ts`
  - Server-only functions for normalization, source priority, signal payloads, and match confidence.
- Modify `src/app/api/calendar/sync/route.ts`
  - Replaces direct per-owner insert/update with signal-first dedupe flow.
- Create `src/app/(internal)/internal/sync-inbox/page.tsx`
  - Lists reviewable sync signals and linked source context.
- Modify `src/components/internal/internal-top-nav.tsx` or the current internal navigation component
  - Adds a Sync Inbox route if this nav file is the active source.
- Modify `docs/CONTEXT_HANDOFF.md` if present
  - Records Phase 1 status and commands after implementation.

## Task 1: Add Failing Contract Tests

**Files:**
- Create: `scripts/test-sync-inbox-calendar-dedupe.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create the failing test file**

Create `scripts/test-sync-inbox-calendar-dedupe.mjs`:

```js
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

test('sync inbox migration creates signal and meeting link tables', () => {
  const migration = read('supabase/migrations/018_sync_inbox_calendar_dedupe.sql')

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
  const sentinels = read('scripts/lib/migration-sentinels.mjs')

  for (const expected of [
    "table: 'sync_signals', column: 'source_provider'",
    "table: 'sync_signals', column: 'source_account_type'",
    "table: 'sync_signals', column: 'source_object_id'",
    "table: 'sync_signals', column: 'status'",
    "table: 'meeting_sync_links', column: 'meeting_id'",
    "table: 'meeting_sync_links', column: 'sync_signal_id'",
  ]) {
    assert.match(sentinels, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('calendar dedupe helper exposes source priority and match helpers', () => {
  assert.ok(exists('src/lib/sync/calendar-dedupe.ts'), 'calendar dedupe helper should exist')
  const helper = read('src/lib/sync/calendar-dedupe.ts')

  assert.match(helper, /export function classifyCalendarAccount/)
  assert.match(helper, /admin/i)
  assert.match(helper, /support/i)
  assert.match(helper, /export function normalizeCalendarEvent/)
  assert.match(helper, /export function buildCalendarDedupeKey/)
  assert.match(helper, /export function scoreCalendarMeetingMatch/)
  assert.match(helper, /export function shouldAutoCreateMeeting/)
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
  assert.doesNotMatch(route, /\.eq\('calendar_event_id', event\.id\)\s*[\s\S]{0,120}\.eq\('owner_id', user\.id\)/)
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
```

- [ ] **Step 2: Add the package script**

Modify `package.json` scripts:

```json
"test:sync-inbox-calendar": "node --test scripts/test-sync-inbox-calendar-dedupe.mjs"
```

- [ ] **Step 3: Run the test and verify it fails**

Run:

```bash
npm run test:sync-inbox-calendar
```

Expected: FAIL because migration `018`, helper `src/lib/sync/calendar-dedupe.ts`, route signal usage, and Sync Inbox page do not exist yet.

- [ ] **Step 4: Commit the failing test**

```bash
git add package.json scripts/test-sync-inbox-calendar-dedupe.mjs
git commit -m "Prove calendar sync needs signal-first dedupe" -m "The current calendar route writes directly into meetings, so this contract describes the source-priority and review-inbox behavior before implementation." -m "Constraint: Phase 1 must stop duplicate meetings without adding Drive, Gmail, finance, or media sync" -m "Confidence: high" -m "Scope-risk: narrow" -m "Tested: npm run test:sync-inbox-calendar (expected failure)" -m "Not-tested: Implementation pending"
```

## Task 2: Add Sync Inbox Schema

**Files:**
- Create: `supabase/migrations/018_sync_inbox_calendar_dedupe.sql`
- Modify: `scripts/lib/migration-sentinels.mjs`

- [ ] **Step 1: Create the migration**

Create `supabase/migrations/018_sync_inbox_calendar_dedupe.sql`:

```sql
-- Migration 018: Sync Inbox calendar dedupe foundation
--
-- Stores raw external sync signals and links them to canonical meetings so
-- admin/support/personal calendars can represent one real meeting.

create table if not exists sync_signals (
  id uuid primary key default uuid_generate_v4(),
  source_provider text not null,
  source_account_id uuid references profiles(id) on delete set null,
  source_account_email text,
  source_account_type text not null default 'personal',
  source_calendar_id text,
  source_object_id text not null,
  source_url text,
  title text,
  occurred_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  extracted_text text,
  dedupe_key text,
  suggested_record_type text,
  suggested_vertical_id uuid references business_verticals(id) on delete set null,
  confidence numeric(5,2) not null default 0,
  status text not null default 'new',
  related_meeting_id uuid references meetings(id) on delete set null,
  related_knowledge_article_id uuid references knowledge_articles(id) on delete set null,
  related_vendor_id uuid references vendors(id) on delete set null,
  related_finance_transaction_id uuid references finance_transactions(id) on delete set null,
  related_task_id uuid references tasks(id) on delete set null,
  error_message text,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (source_provider, source_account_id, source_object_id)
);

alter table sync_signals
  drop constraint if exists sync_signals_source_provider_check,
  add constraint sync_signals_source_provider_check
  check (source_provider in ('google_calendar', 'google_drive', 'finance', 'local_folder', 'gmail', 'github', 'youtube', 'form'));

alter table sync_signals
  drop constraint if exists sync_signals_source_account_type_check,
  add constraint sync_signals_source_account_type_check
  check (source_account_type in ('admin', 'support', 'personal'));

alter table sync_signals
  drop constraint if exists sync_signals_status_check,
  add constraint sync_signals_status_check
  check (status in ('new', 'needs_review', 'matched', 'created', 'ignored', 'error'));

alter table sync_signals
  drop constraint if exists sync_signals_suggested_record_type_check,
  add constraint sync_signals_suggested_record_type_check
  check (
    suggested_record_type is null
    or suggested_record_type in (
      'meeting',
      'prd',
      'brd',
      'company_doc',
      'sop',
      'storyboard',
      'content_plan',
      'training_material',
      'vendor_bill',
      'subscription',
      'project_note',
      'meeting_note',
      'task'
    )
  );

create table if not exists meeting_sync_links (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  sync_signal_id uuid not null references sync_signals(id) on delete cascade,
  source_provider text not null,
  source_account_id uuid references profiles(id) on delete set null,
  source_account_type text not null default 'personal',
  source_object_id text not null,
  match_confidence numeric(5,2) not null default 0,
  match_reason text,
  created_at timestamptz default now(),
  unique (meeting_id, sync_signal_id),
  unique (source_provider, source_account_id, source_object_id)
);

alter table meeting_sync_links
  drop constraint if exists meeting_sync_links_source_account_type_check,
  add constraint meeting_sync_links_source_account_type_check
  check (source_account_type in ('admin', 'support', 'personal'));

create index if not exists idx_sync_signals_status on sync_signals(status);
create index if not exists idx_sync_signals_source on sync_signals(source_provider, source_account_type);
create index if not exists idx_sync_signals_source_object on sync_signals(source_provider, source_object_id);
create index if not exists idx_sync_signals_dedupe_key on sync_signals(dedupe_key);
create index if not exists idx_sync_signals_related_meeting on sync_signals(related_meeting_id);
create index if not exists idx_meeting_sync_links_meeting on meeting_sync_links(meeting_id);
create index if not exists idx_meeting_sync_links_signal on meeting_sync_links(sync_signal_id);
create index if not exists idx_meeting_sync_links_source on meeting_sync_links(source_provider, source_account_type);

drop trigger if exists set_updated_at on sync_signals;
create trigger set_updated_at before update on sync_signals for each row execute function update_updated_at();

alter table sync_signals enable row level security;
alter table meeting_sync_links enable row level security;

drop policy if exists "Internal can manage sync signals" on sync_signals;
create policy "Internal can manage sync signals" on sync_signals
  for all
  using (is_internal_user())
  with check (is_internal_user());

drop policy if exists "Internal can manage meeting sync links" on meeting_sync_links;
create policy "Internal can manage meeting sync links" on meeting_sync_links
  for all
  using (is_internal_user())
  with check (is_internal_user());
```

- [ ] **Step 2: Add migration sentinels**

Modify `scripts/lib/migration-sentinels.mjs` by appending these entries to `SENTINELS`:

```js
  { migration: '018_sync_inbox_calendar_dedupe', table: 'sync_signals', column: 'source_provider' },
  { migration: '018_sync_inbox_calendar_dedupe', table: 'sync_signals', column: 'source_account_type' },
  { migration: '018_sync_inbox_calendar_dedupe', table: 'sync_signals', column: 'source_object_id' },
  { migration: '018_sync_inbox_calendar_dedupe', table: 'sync_signals', column: 'status' },
  { migration: '018_sync_inbox_calendar_dedupe', table: 'meeting_sync_links', column: 'meeting_id' },
  { migration: '018_sync_inbox_calendar_dedupe', table: 'meeting_sync_links', column: 'sync_signal_id' },
```

- [ ] **Step 3: Run the focused test**

Run:

```bash
npm run test:sync-inbox-calendar
```

Expected: still FAIL because helper, route, and page are not implemented, but schema-related assertions pass.

- [ ] **Step 4: Commit schema changes**

```bash
git add supabase/migrations/018_sync_inbox_calendar_dedupe.sql scripts/lib/migration-sentinels.mjs
git commit -m "Create a durable intake layer for synced calendar events" -m "Raw external events now have a first-party place to land before they mutate meetings. Meeting links preserve source provenance without duplicating canonical records." -m "Constraint: Sync records must remain internal-only under existing is_internal_user RLS" -m "Confidence: high" -m "Scope-risk: moderate" -m "Tested: npm run test:sync-inbox-calendar (schema assertions pass; later tasks pending)" -m "Not-tested: Remote migration application"
```

## Task 3: Add Types And Calendar Dedupe Helpers

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/lib/sync/calendar-dedupe.ts`

- [ ] **Step 1: Add sync constants and types**

Modify `src/types/index.ts` near the other constants:

```ts
export const SYNC_SOURCE_PROVIDERS = ['google_calendar', 'google_drive', 'finance', 'local_folder', 'gmail', 'github', 'youtube', 'form'] as const
export type SyncSourceProvider = typeof SYNC_SOURCE_PROVIDERS[number]

export const SYNC_SOURCE_ACCOUNT_TYPES = ['admin', 'support', 'personal'] as const
export type SyncSourceAccountType = typeof SYNC_SOURCE_ACCOUNT_TYPES[number]

export const SYNC_SIGNAL_STATUSES = ['new', 'needs_review', 'matched', 'created', 'ignored', 'error'] as const
export type SyncSignalStatus = typeof SYNC_SIGNAL_STATUSES[number]

export const SYNC_RECORD_TYPES = [
  'meeting',
  'prd',
  'brd',
  'company_doc',
  'sop',
  'storyboard',
  'content_plan',
  'training_material',
  'vendor_bill',
  'subscription',
  'project_note',
  'meeting_note',
  'task',
] as const
export type SyncRecordType = typeof SYNC_RECORD_TYPES[number]

export interface SyncSignal {
  id: string
  source_provider: SyncSourceProvider
  source_account_id?: string | null
  source_account_email?: string | null
  source_account_type: SyncSourceAccountType
  source_calendar_id?: string | null
  source_object_id: string
  source_url?: string | null
  title?: string | null
  occurred_at?: string | null
  payload: Record<string, unknown>
  extracted_text?: string | null
  dedupe_key?: string | null
  suggested_record_type?: SyncRecordType | null
  suggested_vertical_id?: string | null
  confidence: number
  status: SyncSignalStatus
  related_meeting_id?: string | null
  error_message?: string | null
  created_at?: string
  updated_at?: string
}

export interface MeetingSyncLink {
  id: string
  meeting_id: string
  sync_signal_id: string
  source_provider: SyncSourceProvider
  source_account_id?: string | null
  source_account_type: SyncSourceAccountType
  source_object_id: string
  match_confidence: number
  match_reason?: string | null
  created_at?: string
}
```

- [ ] **Step 2: Create the dedupe helper**

Create `src/lib/sync/calendar-dedupe.ts`:

```ts
import 'server-only'
import type { SyncSourceAccountType } from '@/types'

export type GoogleCalendarAttendee = {
  email?: string
  displayName?: string
  responseStatus?: string
}

export type GoogleCalendarEvent = {
  id: string
  htmlLink?: string
  summary?: string
  description?: string
  location?: string
  hangoutLink?: string
  recurringEventId?: string
  iCalUID?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  attendees?: GoogleCalendarAttendee[]
}

export type NormalizedCalendarEvent = {
  sourceObjectId: string
  sourceUrl: string | null
  title: string
  scheduledAt: string
  durationMinutes: number
  attendees: string[]
  agenda: string | null
  meetingLink: string | null
  dedupeKey: string
  recurringEventId: string | null
  iCalUID: string | null
}

export type CalendarAccountProfile = {
  id: string
  email?: string | null
  calendar_email?: string | null
  role?: string | null
}

export type MeetingCandidate = {
  id: string
  title?: string | null
  scheduled_at?: string | null
  attendees?: string[] | null
  meeting_link?: string | null
  calendar_event_id?: string | null
}

export type CalendarMatchResult = {
  meetingId: string | null
  confidence: number
  reason: string
}

const ADMIN_EMAILS = ['admin@zeroorigins.in']
const SUPPORT_EMAILS = ['support@zeroorigins.in']

export function classifyCalendarAccount(profile: CalendarAccountProfile): SyncSourceAccountType {
  const email = (profile.calendar_email || profile.email || '').toLowerCase()
  if (ADMIN_EMAILS.includes(email) || profile.role === 'admin') return 'admin'
  if (SUPPORT_EMAILS.includes(email) || email.startsWith('support@')) return 'support'
  return 'personal'
}

export function shouldAutoCreateMeeting(accountType: SyncSourceAccountType, confidence: number) {
  return (accountType === 'admin' || accountType === 'support') && confidence >= 0.75
}

export function normalizeCalendarEvent(event: GoogleCalendarEvent): NormalizedCalendarEvent | null {
  const title = event.summary?.trim()
  const scheduledAt = event.start?.dateTime || event.start?.date
  if (!event.id || !title || !scheduledAt) return null

  const endTime = event.end?.dateTime || event.end?.date
  const start = new Date(scheduledAt)
  const end = endTime ? new Date(endTime) : null
  const durationMinutes = end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
    ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
    : 30

  const attendees = (event.attendees ?? [])
    .map(attendee => attendee.email?.toLowerCase().trim())
    .filter((email): email is string => Boolean(email))

  const meetingLink = event.hangoutLink || event.location || null

  return {
    sourceObjectId: event.id,
    sourceUrl: event.htmlLink || null,
    title,
    scheduledAt,
    durationMinutes,
    attendees,
    agenda: event.description || null,
    meetingLink,
    dedupeKey: buildCalendarDedupeKey({
      title,
      scheduledAt,
      attendees,
      meetingLink,
      recurringEventId: event.recurringEventId || null,
      iCalUID: event.iCalUID || null,
    }),
    recurringEventId: event.recurringEventId || null,
    iCalUID: event.iCalUID || null,
  }
}

export function buildCalendarDedupeKey(input: {
  title: string
  scheduledAt: string
  attendees: string[]
  meetingLink: string | null
  recurringEventId: string | null
  iCalUID: string | null
}) {
  if (input.iCalUID) return `ical:${input.iCalUID}`
  if (input.recurringEventId) return `recurring:${input.recurringEventId}:${input.scheduledAt.slice(0, 16)}`
  if (input.meetingLink) return `link:${normalizeText(input.meetingLink)}`
  return [
    'time-title',
    input.scheduledAt.slice(0, 16),
    normalizeText(input.title),
    input.attendees.slice().sort().join(','),
  ].join(':')
}

export function scoreCalendarMeetingMatch(event: NormalizedCalendarEvent, candidate: MeetingCandidate): CalendarMatchResult {
  if (candidate.calendar_event_id && candidate.calendar_event_id === event.sourceObjectId) {
    return { meetingId: candidate.id, confidence: 1, reason: 'calendar_event_id' }
  }

  if (candidate.meeting_link && event.meetingLink && normalizeText(candidate.meeting_link) === normalizeText(event.meetingLink)) {
    return { meetingId: candidate.id, confidence: 0.95, reason: 'meeting_link' }
  }

  const candidateTime = candidate.scheduled_at ? new Date(candidate.scheduled_at).getTime() : Number.NaN
  const eventTime = new Date(event.scheduledAt).getTime()
  const minutesApart = Number.isNaN(candidateTime) || Number.isNaN(eventTime)
    ? Number.POSITIVE_INFINITY
    : Math.abs(candidateTime - eventTime) / 60000
  const titleMatches = normalizeText(candidate.title || '') === normalizeText(event.title)
  const attendeeOverlap = overlapCount(candidate.attendees ?? [], event.attendees)

  if (titleMatches && minutesApart <= 10 && attendeeOverlap > 0) {
    return { meetingId: candidate.id, confidence: 0.9, reason: 'title_time_attendees' }
  }

  if (titleMatches && minutesApart <= 5) {
    return { meetingId: candidate.id, confidence: 0.8, reason: 'title_time' }
  }

  return { meetingId: null, confidence: 0, reason: 'no_match' }
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/https?:\/\//g, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

function overlapCount(left: string[], right: string[]) {
  const rightSet = new Set(right.map(value => value.toLowerCase()))
  return left.map(value => value.toLowerCase()).filter(value => rightSet.has(value)).length
}
```

- [ ] **Step 3: Run the focused test**

Run:

```bash
npm run test:sync-inbox-calendar
```

Expected: still FAIL because the route and page are not implemented, but helper assertions pass.

- [ ] **Step 4: Commit helper and type changes**

```bash
git add src/types/index.ts src/lib/sync/calendar-dedupe.ts
git commit -m "Define calendar source priority outside the sync route" -m "Dedupe rules need to be testable and reusable before the route mutates records, so source classification and match scoring live in a focused server-only helper." -m "Constraint: Admin and support calendars are trusted; personal calendars are review-gated unless matched" -m "Confidence: medium" -m "Scope-risk: narrow" -m "Tested: npm run test:sync-inbox-calendar (helper assertions pass; later tasks pending)" -m "Not-tested: Runtime Google Calendar sync"
```

## Task 4: Refactor Google Calendar Sync To Signal-First Dedupe

**Files:**
- Modify: `src/app/api/calendar/sync/route.ts`

- [ ] **Step 1: Replace route imports**

At the top of `src/app/api/calendar/sync/route.ts`, add:

```ts
import {
  classifyCalendarAccount,
  normalizeCalendarEvent,
  scoreCalendarMeetingMatch,
  shouldAutoCreateMeeting,
  type MeetingCandidate,
} from '@/lib/sync/calendar-dedupe'
```

- [ ] **Step 2: Fetch the syncing profile**

After the auth user check, add:

```ts
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, calendar_email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile is not ready for calendar sync.' }, { status: 400 })
  }

  const sourceAccountType = classifyCalendarAccount(profile)
  const sourceAccountEmail = profile.calendar_email || profile.email || user.email || null
```

- [ ] **Step 3: Replace per-event direct lookup with signal upsert and candidate matching**

Inside the `for (const event of events)` loop, replace the current `meetingData`, lookup, insert/update block with:

```ts
    const normalized = normalizeCalendarEvent(event)
    if (!normalized) continue

    const signalPayload = {
      source_provider: 'google_calendar',
      source_account_id: user.id,
      source_account_email: sourceAccountEmail,
      source_account_type: sourceAccountType,
      source_calendar_id: 'primary',
      source_object_id: normalized.sourceObjectId,
      source_url: normalized.sourceUrl,
      title: normalized.title,
      occurred_at: normalized.scheduledAt,
      payload: event,
      extracted_text: [normalized.title, normalized.agenda].filter(Boolean).join('\n\n') || null,
      dedupe_key: normalized.dedupeKey,
      suggested_record_type: 'meeting',
      confidence: 0,
      status: 'new',
    }

    const { data: signal, error: signalError } = await supabase
      .from('sync_signals')
      .upsert(signalPayload, {
        onConflict: 'source_provider,source_account_id,source_object_id',
      })
      .select('id, related_meeting_id')
      .single()

    if (signalError) {
      return NextResponse.json({ error: 'Failed to save calendar signal', details: signalError.message }, { status: 500 })
    }

    const existingLink = await supabase
      .from('meeting_sync_links')
      .select('meeting_id')
      .eq('source_provider', 'google_calendar')
      .eq('source_account_id', user.id)
      .eq('source_object_id', normalized.sourceObjectId)
      .limit(1)

    if (existingLink.error) {
      return NextResponse.json({ error: 'Failed to check existing calendar signal link', details: existingLink.error.message }, { status: 500 })
    }

    let matchedMeetingId = existingLink.data?.[0]?.meeting_id ?? signal.related_meeting_id ?? null
    let matchConfidence = matchedMeetingId ? 1 : 0
    let matchReason = matchedMeetingId ? 'existing_source_link' : 'no_match'

    if (!matchedMeetingId) {
      const { data: candidates, error: candidatesError } = await supabase
        .from('meetings')
        .select('id, title, scheduled_at, attendees, meeting_link, calendar_event_id')
        .gte('scheduled_at', new Date(new Date(normalized.scheduledAt).getTime() - 24 * 60 * 60 * 1000).toISOString())
        .lte('scheduled_at', new Date(new Date(normalized.scheduledAt).getTime() + 24 * 60 * 60 * 1000).toISOString())
        .limit(25)

      if (candidatesError) {
        return NextResponse.json({ error: 'Failed to check candidate meetings', details: candidatesError.message }, { status: 500 })
      }

      const bestMatch = (candidates ?? [])
        .map(candidate => scoreCalendarMeetingMatch(normalized, candidate as MeetingCandidate))
        .sort((left, right) => right.confidence - left.confidence)[0]

      if (bestMatch?.meetingId && bestMatch.confidence >= 0.75) {
        matchedMeetingId = bestMatch.meetingId
        matchConfidence = bestMatch.confidence
        matchReason = bestMatch.reason
      }
    }

    const meetingData = {
      title: normalized.title,
      scheduled_at: normalized.scheduledAt,
      duration_minutes: normalized.durationMinutes,
      attendees: normalized.attendees,
      agenda: normalized.agenda,
      meeting_link: normalized.meetingLink,
      source: 'google_calendar' as const,
      calendar_event_id: normalized.sourceObjectId,
      sync_status: 'ready' as const,
      status: 'scheduled',
      owner_id: user.id,
    }

    if (matchedMeetingId) {
      const { error: updateError } = await supabase
        .from('meetings')
        .update(meetingData)
        .eq('id', matchedMeetingId)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update matched meeting', details: updateError.message }, { status: 500 })
      }

      const { error: linkError } = await supabase
        .from('meeting_sync_links')
        .upsert({
          meeting_id: matchedMeetingId,
          sync_signal_id: signal.id,
          source_provider: 'google_calendar',
          source_account_id: user.id,
          source_account_type: sourceAccountType,
          source_object_id: normalized.sourceObjectId,
          match_confidence: matchConfidence,
          match_reason: matchReason,
        }, {
          onConflict: 'source_provider,source_account_id,source_object_id',
        })

      if (linkError) {
        return NextResponse.json({ error: 'Failed to link calendar signal', details: linkError.message }, { status: 500 })
      }

      await supabase
        .from('sync_signals')
        .update({
          status: 'matched',
          related_meeting_id: matchedMeetingId,
          confidence: matchConfidence,
        })
        .eq('id', signal.id)

      updated++
      continue
    }

    if (!shouldAutoCreateMeeting(sourceAccountType, 1)) {
      await supabase
        .from('sync_signals')
        .update({
          status: 'needs_review',
          confidence: 0.5,
        })
        .eq('id', signal.id)

      continue
    }

    const { data: createdMeeting, error: createError } = await supabase
      .from('meetings')
      .insert({
        ...meetingData,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (createError) {
      return NextResponse.json({ error: 'Failed to save synced meeting', details: createError.message }, { status: 500 })
    }

    const { error: linkError } = await supabase
      .from('meeting_sync_links')
      .upsert({
        meeting_id: createdMeeting.id,
        sync_signal_id: signal.id,
        source_provider: 'google_calendar',
        source_account_id: user.id,
        source_account_type: sourceAccountType,
        source_object_id: normalized.sourceObjectId,
        match_confidence: 1,
        match_reason: `${sourceAccountType}_trusted_source`,
      }, {
        onConflict: 'source_provider,source_account_id,source_object_id',
      })

    if (linkError) {
      return NextResponse.json({ error: 'Failed to link created meeting', details: linkError.message }, { status: 500 })
    }

    await supabase
      .from('sync_signals')
      .update({
        status: 'created',
        related_meeting_id: createdMeeting.id,
        confidence: 1,
      })
      .eq('id', signal.id)

    created++
```

- [ ] **Step 4: Keep the legacy column fallback only if route still needs it**

If the route no longer references `legacyMeetingData` or `isMissingMeetingSyncColumnError`, delete those helpers from `src/app/api/calendar/sync/route.ts`. Do not leave unused helper code.

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test:sync-inbox-calendar
npm run test:crm-team-calendar
```

Expected: Sync Inbox test still FAILS until the page exists. Existing team calendar test should PASS.

- [ ] **Step 6: Commit route refactor**

```bash
git add src/app/api/calendar/sync/route.ts
git commit -m "Route calendar sync through source signals before meetings" -m "The sync route now records raw Google events, matches existing canonical meetings, links sources, and only auto-creates records for trusted admin/support calendars." -m "Constraint: Personal calendars enrich or review-gate; they do not directly create new meetings" -m "Rejected: Keep owner_id plus calendar_event_id matching | fails when admin and support both have the same meeting" -m "Confidence: medium" -m "Scope-risk: moderate" -m "Tested: npm run test:crm-team-calendar; npm run test:sync-inbox-calendar (page pending)" -m "Not-tested: Live Google Calendar API run"
```

## Task 5: Add Minimal Sync Inbox Review Page

**Files:**
- Create: `src/app/(internal)/internal/sync-inbox/page.tsx`
- Modify: current internal nav file after locating it with `rg -n "Control Room|AI Workspace|Finance|Meetings" src/components src/app`

- [ ] **Step 1: Create the page**

Create `src/app/(internal)/internal/sync-inbox/page.tsx`:

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function SyncInboxPage() {
  const supabase = await createClient()
  const { data: signals, error } = await supabase
    .from('sync_signals')
    .select(`
      id,
      title,
      source_provider,
      source_account_email,
      source_account_type,
      suggested_record_type,
      confidence,
      status,
      occurred_at,
      related_meeting_id,
      created_at
    `)
    .in('status', ['new', 'needs_review', 'error'])
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">Operations</p>
          <h1 className="text-2xl font-semibold tracking-tight">ZeroOrigins Sync Inbox</h1>
          <p className="max-w-2xl text-sm leading-6 text-white/48">
            Review personal-calendar-only signals and sync errors before they become operating records.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            Could not load sync signals: {error.message}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-[0.14em] text-white/35">
              <tr>
                <th className="px-4 py-3 font-medium">Signal</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {(signals ?? []).map(signal => (
                <tr key={signal.id} className="bg-black/10">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{signal.title || 'Untitled signal'}</div>
                    {signal.related_meeting_id ? (
                      <Link
                        href={`/internal/meetings/${signal.related_meeting_id}`}
                        className="text-xs text-violet-300 hover:text-violet-200"
                      >
                        Linked meeting
                      </Link>
                    ) : (
                      <div className="text-xs text-white/35">No canonical record yet</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/58">
                    <div>{signal.source_provider}</div>
                    <div className="text-xs text-white/35">
                      {signal.source_account_type} · {signal.source_account_email || 'unknown account'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/58">{signal.suggested_record_type || 'signal'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/58">
                      {signal.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/45">
                    {signal.occurred_at ? new Date(signal.occurred_at).toLocaleString() : 'Not set'}
                  </td>
                </tr>
              ))}
              {!signals?.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-white/38" colSpan={5}>
                    No sync signals need review.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Add navigation**

Find the active internal nav:

```bash
rg -n "Control Room|AI Workspace|Finance|Meetings" src/components src/app
```

Add a `Sync Inbox` link near Meetings/Automation using the local nav pattern. If the active file is `src/components/internal/internal-top-nav.tsx`, add an item equivalent to:

```ts
{
  href: '/internal/sync-inbox',
  label: 'Sync Inbox',
}
```

Use the exact shape already used by that file.

- [ ] **Step 3: Run focused tests**

Run:

```bash
npm run test:sync-inbox-calendar
npm run test:crm-navigation
```

Expected: both PASS.

- [ ] **Step 4: Commit UI changes**

```bash
git add "src/app/(internal)/internal/sync-inbox/page.tsx" src/components
git commit -m "Expose review-gated calendar signals to operators" -m "Personal-only calendar events need a visible queue instead of silently becoming CRM meetings or disappearing from the sync run." -m "Constraint: Phase 1 only lists reviewable signals; action workflows come after dedupe is proven" -m "Confidence: medium" -m "Scope-risk: narrow" -m "Tested: npm run test:sync-inbox-calendar; npm run test:crm-navigation" -m "Not-tested: Manual browser review"
```

## Task 6: Verification And Handoff

**Files:**
- Modify: `docs/CONTEXT_HANDOFF.md` if it exists

- [ ] **Step 1: Run full relevant verification**

Run:

```bash
npm run test:sync-inbox-calendar
npm run test:crm-team-calendar
npm run test:crm-navigation
npm run check:migrations
npm run lint
npm run build
```

Expected:
- `test:sync-inbox-calendar`: PASS
- `test:crm-team-calendar`: PASS
- `test:crm-navigation`: PASS
- `check:migrations`: may FAIL until migration `018` and previously drifted migration `013` columns are applied to the remote Supabase database. If it fails, record the exact missing sentinels.
- `lint`: PASS
- `build`: PASS

- [ ] **Step 2: Update handoff docs**

If `docs/CONTEXT_HANDOFF.md` exists, append:

```md
## Sync Inbox Calendar Dedupe Phase 1

- Added Sync Inbox schema for raw signals and meeting source links.
- Admin/support calendars are trusted sources; personal-only calendar events are review-gated.
- Google Calendar sync now stores source signals before creating or updating meetings.
- Review UI is available at `/internal/sync-inbox`.
- Verification run:
  - `npm run test:sync-inbox-calendar`
  - `npm run test:crm-team-calendar`
  - `npm run test:crm-navigation`
  - `npm run check:migrations`
  - `npm run lint`
  - `npm run build`
- Remote migration note: paste `supabase/migrations/018_sync_inbox_calendar_dedupe.sql` into Supabase SQL editor after earlier unapplied migrations are reconciled.
```

- [ ] **Step 3: Commit handoff**

```bash
git add docs/CONTEXT_HANDOFF.md
git commit -m "Record how calendar sync dedupe is verified" -m "The handoff captures the new Sync Inbox behavior, verification commands, and remote migration caveat so the next agent can resume without chat history." -m "Confidence: high" -m "Scope-risk: narrow" -m "Tested: Documentation-only update after verification commands" -m "Not-tested: Remote migration application"
```

- [ ] **Step 4: Final status**

Run:

```bash
git status --short
git log --oneline -5
```

Expected: only unrelated pre-existing files, such as `docs/naming/`, remain untracked or modified.

## Self-Review

Spec coverage:
- Raw calendar signal storage: Task 2.
- Meeting source links: Task 2 and Task 4.
- Admin/support source priority: Task 3 and Task 4.
- Calendar sync match-before-insert: Task 4.
- Personal-calendar-only review queue: Task 4 and Task 5.
- Source/account context visible: Task 5.
- Focused tests: Task 1 plus task-level verification.

Known gaps:
- Review actions such as create/link/ignore are not built in Phase 1. The page only exposes the queue because Phase 1 acceptance requires visibility, not full workflow actions.
- Remote Supabase migration application is not automated by this plan.
- This plan does not add Drive, Gmail, finance, YouTube, or AI classification sync.
