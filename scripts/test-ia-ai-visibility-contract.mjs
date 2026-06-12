import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SENTINELS } from './lib/migration-sentinels.mjs'

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

const navigation = await source('src/lib/internal-navigation.ts')
const aiWorkspacePage = await source('src/app/(internal)/internal/ai-workspace/page.tsx')
const actions = await source('src/lib/actions/internal-resources.ts')
const aiAssistActions = await source('src/lib/actions/ai-assist.ts')
const css = await source('src/app/globals.css')

for (const href of [
  '/internal/control-room',
  '/internal/business-verticals',
  '/internal/ai-workspace',
  '/internal/automation',
  '/internal/tasks',
  '/internal/meetings',
  '/internal/finance',
  '/internal/knowledge',
  '/internal/settings',
]) {
  assert.ok(navigation.includes(`href: '${href}'`), `Navigation must expose ${href}`)
}

for (const group of ['command', 'build', 'automate', 'pipeline', 'work', 'truth', 'admin']) {
  assert.ok(navigation.includes(`id: '${group}'`), `Navigation must include ${group} group`)
}

assert.ok(
  !aiWorkspacePage.includes('brands, and products'),
  'AI Workspace must not describe itself as a brand/product dumping ground'
)

for (const capability of [
  'Email Intelligence',
  'Task Assistant',
  'Meeting Assistant',
  'Proposal Assistant',
  'Content Assistant',
  'Prompt Lab',
  'Automation Runs',
  'Model Settings',
]) {
  assert.ok(aiWorkspacePage.includes(capability), `AI Workspace missing ${capability}`)
}

for (const column of [
  'business_verticals.name',
  'business_verticals.slug',
  'business_verticals.type',
  'business_verticals.status',
  'ai_assist_requests.intent',
  'ai_assist_requests.ai_output_json',
  'ai_assist_requests.status',
]) {
  assert.ok(
    SENTINELS.some(sentinel => `${sentinel.table}.${sentinel.column}` === column),
    `Missing Phase 5 schema sentinel for ${column}`
  )
}

for (const action of ['createBusinessVertical', 'updateBusinessVertical']) {
  assert.ok(actions.includes(`export async function ${action}(`), `Missing ${action} server action`)
}

for (const action of ['createAiAssistDraft', 'confirmAiAssistDraft']) {
  assert.ok(aiAssistActions.includes(`export async function ${action}(`), `Missing ${action} server action`)
}

assert.match(css, /select\s+option/, 'Global CSS must style native select options for dark dropdowns')
assert.match(css, /background-color:\s*var\(--popover\)/, 'Native select options must use dark-safe popover background')

console.log('Verified CRM IA and AI visibility contract.')
