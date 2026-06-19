import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const errorPath = 'src/app/(internal)/error.tsx'
const notFoundPath = 'src/app/(internal)/not-found.tsx'

assert.ok(existsSync(errorPath), 'Internal app must define an error boundary.')
assert.ok(existsSync(notFoundPath), 'Internal app must define a not-found boundary.')

const errorPage = readFileSync(errorPath, 'utf8')
const notFoundPage = readFileSync(notFoundPath, 'utf8')

for (const source of [errorPage, notFoundPage]) {
  assert.match(source, /\/internal\/control-room/, 'Internal recovery screens must link to Control Room.')
  assert.match(source, /\/internal\/leads/, 'Internal recovery screens must link to Leads.')
}

assert.match(errorPage, /reset\(\)/, 'Internal error boundary must expose retry without forcing relogin.')

console.log('Internal error boundary contract OK')
