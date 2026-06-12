# CRM Team Calendar Phase 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make internal team operations explicit by replacing the Settings placeholder with profile/team management foundations and adding My Calendar / Team Calendar filtering to first-party meetings.

**Architecture:** Keep team data on the existing `profiles` table and meeting ownership on the existing `meetings.owner_id` column. Add only calendar identity metadata needed for later external sync, then expose it through server-rendered internal pages and existing client-form/server-action patterns.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase Postgres/RLS, script-level Node tests, Tailwind v4, existing Resource Kit UI.

---

## File Map

- Create `supabase/migrations/012_team_calendar_foundations.sql`: adds `profiles.calendar_email`, `profiles.calendar_provider`, `profiles.calendar_sync_enabled`, `profiles.calendar_sync_status`, and owner/calendar indexes.
- Modify `scripts/lib/migration-sentinels.mjs`: covers the new profile calendar columns and meeting ownership indexes.
- Create `scripts/test-team-calendar-contract.mjs`: test-first contract for Phase 4 schema, actions, routes, and meeting filters.
- Modify `package.json`: adds `test:crm-team-calendar`.
- Modify `src/types/index.ts`: expands `Profile` with calendar fields and adds profile status/provider constants.
- Modify `src/lib/actions/internal-resources.ts`: adds `TeamProfileFormInput` and `updateTeamProfile`, using `requireInternalUser`.
- Create `src/components/forms/TeamProfileForm.tsx`: leadership-facing profile edit form for status, role, title, calendar identity, and sync readiness.
- Replace `src/app/(internal)/internal/settings/page.tsx`: shows active/pending/disabled internal users and embeds team profile forms.
- Modify `src/app/(internal)/internal/meetings/page.tsx`: supports `?calendar=my` and `?calendar=team`, shows owner/attendee context, and keeps team as the default.
- Modify `src/components/forms/MeetingForm.tsx`: allows selecting a meeting owner from internal profiles.
- Modify `src/app/(internal)/internal/meetings/new/page.tsx` and `[id]/edit/page.tsx`: pass internal profile owner options.
- Update `docs/CONTEXT_HANDOFF.md`: records Phase 4 status and next phase.

## Task 1: Phase 4 Contract Test

**Files:**
- Create: `scripts/test-team-calendar-contract.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = relativePath => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
const exists = relativePath => fs.existsSync(path.join(repoRoot, relativePath))

test('Phase 4 migration adds calendar identity fields to profiles', () => {
  const migration = read('supabase/migrations/012_team_calendar_foundations.sql')
  for (const expected of ['calendar_email', 'calendar_provider', 'calendar_sync_enabled', 'calendar_sync_status']) {
    assert.ok(migration.includes(expected), `missing ${expected}`)
  }
})

test('team profile actions expose updateTeamProfile with calendar fields', () => {
  const source = read('src/lib/actions/internal-resources.ts')
  assert.match(source, /export type TeamProfileFormInput/)
  assert.match(source, /export async function updateTeamProfile/)
  assert.match(source, /calendar_email/)
  assert.match(source, /calendar_provider/)
})

test('Settings is a backed team management page', () => {
  assert.ok(exists('src/components/forms/TeamProfileForm.tsx'))
  const page = read('src/app/(internal)/internal/settings/page.tsx')
  assert.match(page, /profiles/)
  assert.match(page, /TeamProfileForm/)
  assert.doesNotMatch(page, /ComingSoon/)
})

test('Meetings page supports my and team calendar filters', () => {
  const page = read('src/app/(internal)/internal/meetings/page.tsx')
  assert.match(page, /searchParams/)
  assert.match(page, /calendar=my/)
  assert.match(page, /calendar=team/)
  assert.match(page, /owner_id/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/test-team-calendar-contract.mjs`

Expected: FAIL because `012_team_calendar_foundations.sql`, `TeamProfileForm`, `updateTeamProfile`, and calendar filters do not exist yet.

- [ ] **Step 3: Add package script**

Add this script in `package.json`:

```json
"test:crm-team-calendar": "node --test scripts/test-team-calendar-contract.mjs"
```

- [ ] **Step 4: Commit the failing contract**

```bash
git add docs/superpowers/plans/2026-06-13-crm-team-calendar-phase-4.md scripts/test-team-calendar-contract.mjs package.json
git commit
```

## Task 2: Schema And Types

**Files:**
- Create: `supabase/migrations/012_team_calendar_foundations.sql`
- Modify: `scripts/lib/migration-sentinels.mjs`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add migration**

```sql
alter table profiles
  add column if not exists calendar_email text,
  add column if not exists calendar_provider text not null default 'none',
  add column if not exists calendar_sync_enabled boolean not null default false,
  add column if not exists calendar_sync_status text not null default 'not_connected';

alter table profiles
  drop constraint if exists profiles_calendar_provider_check,
  add constraint profiles_calendar_provider_check
  check (calendar_provider in ('none', 'google'));

alter table profiles
  drop constraint if exists profiles_calendar_sync_status_check,
  add constraint profiles_calendar_sync_status_check
  check (calendar_sync_status in ('not_connected', 'ready', 'paused', 'error'));

create index if not exists idx_profiles_calendar_email on profiles(calendar_email);
create index if not exists idx_meetings_owner_id on meetings(owner_id);
```

- [ ] **Step 2: Extend sentinels**

Add sentinels for the four new profile columns.

- [ ] **Step 3: Extend types**

Add `CALENDAR_PROVIDERS`, `CALENDAR_SYNC_STATUSES`, `ProfileStatus`, `CalendarProvider`, `CalendarSyncStatus`, and optional fields on `Profile`.

- [ ] **Step 4: Run contract**

Run: `npm run test:crm-team-calendar`

Expected: still FAIL until actions/pages are implemented.

## Task 3: Team Profile Action And Form

**Files:**
- Modify: `src/lib/actions/internal-resources.ts`
- Create: `src/components/forms/TeamProfileForm.tsx`

- [ ] **Step 1: Add server action**

Add `TeamProfileFormInput` and `updateTeamProfile(profileId, input)`. It must require an active internal user, update only `profiles`, and revalidate `/internal/settings`, `/internal/control-room`, and `/internal/meetings`.

- [ ] **Step 2: Add client form**

Build `TeamProfileForm` with fields for full name, title, role, status, calendar email, provider, sync enabled, and sync status. Use existing button/input/label/card components and return action errors inline.

- [ ] **Step 3: Run contract**

Run: `npm run test:crm-team-calendar`

Expected: still FAIL until Settings and Meetings pages are implemented.

## Task 4: Settings Team Management

**Files:**
- Modify: `src/app/(internal)/internal/settings/page.tsx`

- [ ] **Step 1: Replace placeholder**

Fetch internal profiles ordered by status/email. Render summary counts for active, pending, and disabled users. Render each internal profile with `TeamProfileForm`.

- [ ] **Step 2: Keep Settings internal/admin scoped**

The existing navigation already scopes Settings to `admin`. The page itself should fetch the current profile and return a simple access message for non-admin internal users.

- [ ] **Step 3: Run contract**

Run: `npm run test:crm-team-calendar`

Expected: still FAIL until Meetings filters are implemented.

## Task 5: Meeting Calendar Filters

**Files:**
- Modify: `src/app/(internal)/internal/meetings/page.tsx`
- Modify: `src/components/forms/MeetingForm.tsx`
- Modify: `src/app/(internal)/internal/meetings/new/page.tsx`
- Modify: `src/app/(internal)/internal/meetings/[id]/edit/page.tsx`
- Modify: `src/lib/actions/internal-resources.ts`

- [ ] **Step 1: Add owner support to meeting payload**

Allow `MeetingFormInput.owner_id`, default create to the current user, and preserve/update owner on edit.

- [ ] **Step 2: Add owner select to the form**

Pass profile options from new/edit pages and include an owner dropdown.

- [ ] **Step 3: Add list filters**

`/internal/meetings?calendar=team` shows all first-party meetings. `/internal/meetings?calendar=my` filters to rows where `owner_id` is the current internal user or the current user's email appears in `attendees`.

- [ ] **Step 4: Show owner context**

Select owner profile data on the meetings page and add an `Owner` column.

- [ ] **Step 5: Run contract**

Run: `npm run test:crm-team-calendar`

Expected: PASS.

## Task 6: Verification, Documentation, Commit, Push

**Files:**
- Modify: `docs/CONTEXT_HANDOFF.md`

- [ ] **Step 1: Full verification**

Run:

```powershell
npm run test:crm-team-calendar
npm run test:crm-knowledge
npm run test:crm-navigation
npm run test:crm-foundation
npm run check:migrations
npm run check:crm
npm run lint
npm run build
```

- [ ] **Step 2: Update handoff**

Record Phase 4 shipped items, verification, known warnings, and next phase: Finance Operating Console.

- [ ] **Step 3: Commit and push**

Use Lore commit messages. Push `phase/crm-team-calendar-phase-4`.

## Self-Review

- Spec coverage: Settings placeholder replacement, profile status/role/title/calendar identity, My Calendar/Team Calendar filters, and no Google Calendar sync are covered.
- Placeholder scan: No implementation placeholders are used; future Google sync is explicitly deferred through calendar metadata only.
- Type consistency: Calendar/provider/status fields are consistently named across migration, sentinels, types, action, and form.
