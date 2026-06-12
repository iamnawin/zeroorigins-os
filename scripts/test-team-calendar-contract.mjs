import assert from 'node:assert/strict'
import fs from 'node:fs'
import { test } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath))
}

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
