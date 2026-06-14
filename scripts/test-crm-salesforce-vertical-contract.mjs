import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('CRM and Salesforce Systems is seeded as a strategic business vertical', () => {
  const migration = fs.readdirSync(path.join(repoRoot, 'supabase/migrations'))
    .filter(file => file.endsWith('.sql'))
    .map(file => read(`supabase/migrations/${file}`))
    .join('\n')
  const types = read('src/types/index.ts')

  assert.match(migration, /CRM & Salesforce Systems/)
  assert.match(migration, /crm-salesforce-systems/)
  assert.match(migration, /Sales Cloud/)
  assert.match(migration, /Service Cloud/)
  assert.match(migration, /Experience Cloud/)
  assert.match(migration, /next_action/)
  assert.match(types, /'crm'/)
  assert.match(types, /'salesforce_app'/)
})

test('workspace sync assigns Salesforce products and ideas to the CRM vertical', () => {
  const scanner = read('scripts/scan-workspace.mjs')
  const importer = read('scripts/import-workspace-inventory.mjs')

  assert.match(scanner, /CRM_VERTICAL_SLUG/)
  assert.match(scanner, /crm-salesforce-systems/)
  assert.match(scanner, /ServiceOps Pulse/)
  assert.match(scanner, /OrgTrace/)
  assert.match(scanner, /Perfect-Store-Scorecard/)
  assert.match(scanner, /Salesforce Automation Packs/)
  assert.match(scanner, /CRM Implementation Accelerators/)
  assert.match(scanner, /Experience Cloud \/ Portal Systems/)
  assert.match(importer, /vertical_id: await verticalIdForSlug\(idea\.vertical_slug\)/)
  assert.match(importer, /vertical_id: await verticalIdForSlug\(app\.vertical_slug\)/)
})

test('applications can be edited under a business vertical', () => {
  const form = read('src/components/forms/ApplicationForm.tsx')
  const actions = read('src/lib/actions/internal-resources.ts')
  const newPage = read('src/app/(internal)/internal/applications/new/page.tsx')
  const editPage = read('src/app/(internal)/internal/applications/[id]/edit/page.tsx')

  assert.match(actions, /vertical_id\?: string/)
  assert.match(actions, /vertical_id: optionalText\(input\.vertical_id\)/)
  assert.match(actions, /next_action: optionalText\(input\.next_action\)/)
  assert.match(form, /Business Vertical/)
  assert.match(form, /vertical_id/)
  assert.match(form, /Next Action/)
  assert.match(newPage, /business_verticals/)
  assert.match(editPage, /business_verticals/)
})

test('vertical and application cards show CRM hierarchy fields', () => {
  const verticalDetail = read('src/app/(internal)/internal/business-verticals/[id]/page.tsx')
  const applicationList = read('src/app/(internal)/internal/applications/page.tsx')
  const applicationDetail = read('src/app/(internal)/internal/applications/[id]/page.tsx')

  assert.match(verticalDetail, /Applications \/ Products/)
  assert.match(verticalDetail, /Next Action/)
  assert.match(verticalDetail, /Related Tasks/)
  assert.match(verticalDetail, /stage: idea \/ MVP \/ active \/ package-ready \/ live/)
  assert.match(verticalDetail, /applications/)
  assert.match(applicationList, /business_verticals/)
  assert.match(applicationList, /app\.vertical/)
  assert.match(applicationList, /Owner/)
  assert.match(applicationDetail, /Purpose/)
  assert.match(applicationDetail, /Next Action/)
})
