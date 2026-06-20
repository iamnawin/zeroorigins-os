import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const controlRoom = readFileSync('src/app/(internal)/internal/control-room/page.tsx', 'utf8')
const assistPanel = readFileSync('src/components/ai/AiAssistPanel.tsx', 'utf8')
const entityTable = readFileSync('src/components/resource-kit/entity-table.tsx', 'utf8')
const leadsPage = readFileSync('src/app/(internal)/internal/leads/page.tsx', 'utf8')

assert.match(controlRoom, /space-y-4 sm:space-y-5/, 'Control Room should use compact vertical rhythm on mobile.')
assert.match(controlRoom, /rounded-xl border border-zo-purple\/20/, 'Hero should use a tighter shell than the old oversized panel.')
assert.match(controlRoom, /text-2xl font-bold tracking-tight text-white sm:text-3xl/, 'Hero headline should not use desktop-scale type on phones.')
assert.match(controlRoom, /grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6/, 'Business Pulse should fit two compact metrics per mobile row.')
assert.match(controlRoom, /Radar Headlines/, 'Radar news section should use a plain readable heading.')

assert.match(assistPanel, /overflow-x-auto/, 'Command Center quick actions should scroll horizontally on phones.')
assert.match(assistPanel, /rows=\{embedded \? 3 : 5\}/, 'Embedded Command Center should use a shorter input on dense dashboards.')

assert.match(entityTable, /space-y-2 md:hidden/, 'Mobile entity cards should use compact spacing.')
assert.match(entityTable, /bg-card\/70 p-3/, 'Mobile entity cards should not be oversized.')
assert.match(entityTable, /text-xs text-muted-foreground/, 'Mobile entity details should use compact metadata text.')

assert.match(leadsPage, /space-y-4/, 'Leads list should use compact page spacing.')
assert.match(leadsPage, /flex flex-col gap-2 p-3 sm:flex-row/, 'Lead records should stack cleanly on phones.')
assert.match(leadsPage, /truncate text-xs text-muted-foreground/, 'Lead metadata should truncate instead of overflowing.')

console.log('Control Room mobile density contract OK')
