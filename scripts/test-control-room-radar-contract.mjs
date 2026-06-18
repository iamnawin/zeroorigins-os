import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('src/app/(internal)/internal/control-room/page.tsx', 'utf8')

assert.match(source, /from\('radar_items'\)/, 'Control Room must fetch Radar items for the home briefing.')
assert.match(source, /hotRadarSignals/, 'Control Room must rank hot Radar signals for the home UI.')
assert.match(source, /Math\.max\(.*relevance_score.*content_potential_score/s, 'Hot Radar signals must consider both relevance and content potential scores.')
assert.match(source, /Headlines to Catch/, 'Control Room must show a readable Radar headline section on home.')
assert.match(source, /Ranked by Radar score/, 'Radar home UI must explain why these news items are highlighted.')
assert.match(source, /readableRadarHeadline/, 'Hot Radar cards must derive readable headlines instead of showing raw source titles.')
assert.match(source, /humanizeRepoTitle/, 'GitHub repository Radar titles must be humanized for home headlines.')
assert.match(source, /item\.source_name \|\| item\.source\?\.name/, 'Hot Radar cards must keep source names as metadata.')
assert.match(source, /href=\{`\/internal\/radar\/\$\{item\.id\}`\}/, 'Hot Radar items must link back to their Radar detail pages.')
assert.match(source, /function AccordionPanel/, 'Control Room lower cards must use an accordion panel component.')
assert.match(source, /<details/, 'Accordion panels must be implemented with native disclosure for mobile-friendly behavior.')
assert.match(source, /defaultOpen/, 'Top priority accordion sections should be able to start open.')
assert.match(source, /AccordionPanel title="Business Pulse"/, 'Business Pulse should become an accordion section.')
assert.match(source, /AccordionPanel title="Agent Activity"/, 'Lower side cards should become accordion sections too.')

console.log('Control Room Radar contract OK')
