import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')
const scriptPath = path.join(repoRoot, 'scripts', 'sync-ai-workspace.mjs')
const workspaceRoot = path.resolve(repoRoot, '..', '..')

function runSync(args = [], env = {}) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      AI_WORKSPACE_ROOT: workspaceRoot,
      SUPABASE_SERVICE_ROLE_KEY: '',
      ...env,
    },
    encoding: 'utf8',
  })
}

test('dry run detects Next.js apps from local workspace files', () => {
  const result = runSync(['--dry-run'])

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /zeroorigins-os \[active\] - nextjs_app/)
})

test('database sync without service-role key fails loudly', () => {
  const result = runSync([])

  assert.notEqual(result.status, 0)
  assert.match(result.stdout + result.stderr, /SUPABASE_SERVICE_ROLE_KEY/)
})
