import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('automation page shows local workspace sync status instead of a fake scheduler', () => {
  const source = read('src/app/(internal)/internal/automation/page.tsx')

  assert.match(source, /Workspace Source Sync/)
  assert.match(source, /Manual local scan/)
  assert.match(source, /No scheduler configured/)
  assert.match(source, /Last app sync/)
  assert.match(source, /Last source sync/)
  assert.match(source, /Never-synced apps/)
  assert.match(source, /npm run scan:workspace/)
  assert.match(source, /npm run import:workspace/)
  assert.match(source, /\.from\('applications'\)[\s\S]*last_synced_at/)
  assert.match(source, /\.from\('business_ideas'\)/)
  assert.match(source, /\.from\('source_registry'\)[\s\S]*last_synced_at/)
})
