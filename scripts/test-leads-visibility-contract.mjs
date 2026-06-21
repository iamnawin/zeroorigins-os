import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('lead pages verify internal access before using service-role reads', () => {
  const listPage = read('src/app/(internal)/internal/leads/page.tsx')
  const detailPage = read('src/app/(internal)/internal/leads/[id]/page.tsx')

  for (const source of [listPage, detailPage]) {
    assert.match(source, /requireInternalUser/, 'Lead page must authenticate the internal user before bypassing RLS.')
    assert.match(source, /createServiceClient/, 'Lead page must read through service client after internal auth.')
  }

  assert.doesNotMatch(detailPage, /notFound\(\)/, 'Lead detail should not render the global 404 for an invisible or stale lead link.')
  assert.match(detailPage, /Lead not available/, 'Lead detail should render a recoverable missing-lead state.')
  assert.match(detailPage, /try\s*{[\s\S]*createServiceClient/, 'Lead detail should catch service-role or Supabase read failures.')
  assert.match(detailPage, /Lead could not load/, 'Lead detail should render a recoverable error state instead of the generic Next error page.')
})

test('lead detail passes only serializable redirect data to client components', () => {
  const detailPage = read('src/app/(internal)/internal/leads/[id]/page.tsx')
  const actionButton = read('src/components/internal/crm-action-button.tsx')

  assert.doesNotMatch(
    detailPage,
    /redirectTo=\{[^}]*=>/,
    'Server-rendered lead detail must not pass a function to the client action button.',
  )
  assert.match(detailPage, /redirectPath="\/internal\/deals"/)
  assert.match(actionButton, /redirectPath\?: string/)
  assert.doesNotMatch(actionButton, /redirectTo\?:\s*\(/)
})
