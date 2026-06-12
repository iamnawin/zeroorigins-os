import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SENTINELS } from './lib/migration-sentinels.mjs'

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

const navigation = await source('src/lib/internal-navigation.ts')
const layout = await source('src/app/(internal)/layout.tsx')
const sidebar = await source('src/components/layout/internal-sidebar.tsx')
const header = await source('src/components/layout/internal-header.tsx')
const aiWorkspacePage = await source('src/app/(internal)/internal/ai-workspace/page.tsx')
const controlRoomPage = await source('src/app/(internal)/internal/control-room/page.tsx')
const financePage = await source('src/app/(internal)/internal/finance/page.tsx')
const vendorForm = await source('src/components/forms/VendorForm.tsx')
const typesSource = await source('src/types/index.ts')
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

for (const group of ['command', 'pipeline', 'work', 'automate', 'finance', 'truth', 'admin']) {
  assert.ok(navigation.includes(`id: '${group}'`), `Navigation must include ${group} group`)
}

assert.ok(layout.includes('InternalSidebar'), 'Internal layout must use a desktop sidebar')
assert.ok(layout.includes('InternalHeader'), 'Internal layout top bar must be action-oriented, not navigation-heavy')
assert.ok(sidebar.includes('filterInternalNavGroups'), 'Sidebar must render grouped navigation from internal-navigation metadata')
assert.ok(navigation.includes("label: 'Pipeline'") && navigation.includes("label: 'Work'") && navigation.includes("label: 'Automation'"), 'Sidebar metadata must use grouped navigation labels')
assert.ok(header.includes('Global search'), 'Top bar must expose global search')
assert.ok(header.includes('Quick Add'), 'Top bar must expose Quick Add')
assert.ok(header.includes('Sync'), 'Top bar must expose Sync')

for (const section of ['Today&apos;s Focus', 'Quick Actions', 'Pipeline Snapshot', 'Automation Feed', 'Finance Snapshot']) {
  assert.ok(controlRoomPage.includes(section), `Control Room missing ${section}`)
}

for (const currency of ['INR', 'USD', 'EUR', 'GBP']) {
  assert.ok(typesSource.includes(`'${currency}'`), `Currency enum missing ${currency}`)
}
assert.ok(vendorForm.includes('CURRENCIES.map'), 'Vendor form must render canonical currency options')
assert.ok(financePage.includes('defaultCurrency'), 'Finance page must expose a default currency concept')
assert.ok(!financePage.includes("currency: 'USD'"), 'Finance page must not hardcode USD-only formatting')

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
