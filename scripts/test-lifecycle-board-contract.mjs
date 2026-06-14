import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('lifecycle migration preserves existing data and adds missing movement fields', () => {
  const migration = read('supabase/migrations/018_product_lifecycle_board.sql')

  assert.match(migration, /alter table business_ideas add column if not exists promoted_at/)
  assert.match(migration, /alter table business_ideas add column if not exists promoted_by/)
  assert.match(migration, /alter table business_ideas add column if not exists linked_application_id/)
  assert.match(migration, /alter table applications add column if not exists next_action/)
  assert.match(migration, /business_ideas_status_check/)
  assert.match(migration, /applications_stage_check/)
  assert.match(migration, /applications_status_check/)
  assert.match(migration, /activity_logs/)
  assert.match(migration, /promoted_to_application/)
  assert.match(migration, /reverted_to_idea/)
})

test('server actions move lifecycle cards and log activity', () => {
  const actions = read('src/lib/actions/lifecycle-board.ts')

  assert.match(actions, /export async function moveLifecycleCard/)
  assert.match(actions, /export async function promoteIdeaToApplication/)
  assert.match(actions, /export async function revertApplicationToIdea/)
  assert.match(actions, /\.from\('business_ideas'\)/)
  assert.match(actions, /\.from\('applications'\)/)
  assert.match(actions, /\.from\('activity_logs'\)/)
  assert.match(actions, /promoted_at: new Date\(\)\.toISOString\(\)/)
  assert.match(actions, /promoted_by: user\.id/)
  assert.match(actions, /linked_application_id/)
  assert.match(actions, /source_idea_id/)
  assert.match(actions, /requiresConfirmation: true/)
})

test('applications page renders lifecycle board with ideas and applications', () => {
  const page = read('src/app/(internal)/internal/applications/page.tsx')

  assert.match(page, /LifecycleBoard/)
  assert.match(page, /business_ideas/)
  assert.match(page, /source_idea:business_ideas/)
  assert.match(page, /business_verticals/)
})

test('lifecycle board exposes drag/drop states and confirmation modals', () => {
  const board = read('src/components/lifecycle/LifecycleBoard.tsx')
  const column = read('src/components/lifecycle/LifecycleColumn.tsx')
  const card = read('src/components/lifecycle/DraggableLifecycleCard.tsx')
  const promote = read('src/components/lifecycle/PromoteIdeaModal.tsx')
  const confirm = read('src/components/lifecycle/MoveCardConfirmationModal.tsx')
  const hook = read('src/components/lifecycle/useLifecycleMove.ts')

  assert.match(board, /Ideas/)
  assert.match(board, /Evaluating/)
  assert.match(board, /Experiment/)
  assert.match(board, /Prototype/)
  assert.match(board, /Application/)
  assert.match(board, /Production Ready/)
  assert.match(board, /Live/)
  assert.match(board, /Archived/)
  assert.match(column, /DropZoneState/)
  assert.match(column, /data-drop-state/)
  assert.match(card, /draggable/)
  assert.match(card, /scale-\[1\.02\]/)
  assert.match(card, /shadow-zo-purple/)
  assert.match(promote, /Promote idea to application\?/)
  assert.match(promote, /Application name/)
  assert.match(promote, /Business vertical/)
  assert.match(promote, /Initial status/)
  assert.match(promote, /Next action/)
  assert.match(confirm, /where the card came from/)
  assert.match(confirm, /where it is going/)
  assert.match(confirm, /what status will change/)
  assert.match(hook, /success/i)
  assert.match(hook, /rollback/i)
  assert.match(hook, /moveLifecycleCard/)
})
