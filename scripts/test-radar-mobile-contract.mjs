import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync('src/app/(internal)/internal/radar/page.tsx', 'utf8')
const card = readFileSync('src/components/radar/radar-item-card.tsx', 'utf8')

assert.match(page, /grid-cols-2/, 'Radar stats must start from a two-column mobile layout.')
assert.doesNotMatch(page, /grid grid-cols-3 gap-3 sm:grid-cols-6/, 'Radar stats must not use the cramped three-column phone grid.')

assert.match(page, /RssSyncButton/, 'Radar dashboard must expose manual RSS sync from the main page.')
assert.match(page, /getRadarSourceHealth/, 'Radar dashboard must load source health for RSS status context.')
assert.match(page, /Daily cron/, 'Radar dashboard must explain the daily cron status.')

assert.match(page, /sm:hidden/, 'Radar filters need a compact mobile-only category control.')
assert.match(page, /hidden sm:flex/, 'Radar can keep full filter chips on wider screens only.')
assert.match(page, /Category/, 'Mobile filter control must label category selection clearly.')

assert.match(card, /min-h-\[/, 'Radar item cards need a stable touch target on mobile.')
assert.match(card, /min-w-0/, 'Radar item card text areas must allow truncation without horizontal overflow.')
assert.match(card, /justify-between/, 'Radar item metadata must keep source and date separated.')

console.log('Radar mobile contract OK')
