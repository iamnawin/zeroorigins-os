import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')

test('homepage gateway uses an explicit dark background independent of system theme', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'src/app/page.tsx'), 'utf8')

  assert.match(source, /className="dark min-h-screen bg-black text-white/)
  assert.doesNotMatch(source, /className="dark min-h-screen bg-background/)
})
