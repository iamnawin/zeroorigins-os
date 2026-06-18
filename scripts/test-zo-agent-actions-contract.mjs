import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const types = readFileSync('src/types/index.ts', 'utf8')
const intents = readFileSync('src/lib/ai/assist-intents.ts', 'utf8')
const actions = readFileSync('src/lib/actions/ai-assist.ts', 'utf8')
const panel = readFileSync('src/components/ai/AiAssistPanel.tsx', 'utf8')
const reviewCard = readFileSync('src/components/ai/AiDraftReviewCard.tsx', 'utf8')
const migration = readFileSync('supabase/migrations/022_zo_agent_deal_intent.sql', 'utf8')

assert.match(types, /'create_deal'/, 'AiAssistIntent must include create_deal.')
assert.match(intents, /intent: 'create_deal'/, 'ZO_Agent quick actions must include create_deal.')
assert.match(intents, /create_deal: 'Generate Deal Draft'/, 'ZO_Agent button labels must include create_deal.')
assert.match(intents, /create_deal: 'draft'/, 'ZO_Agent intent modes must mark create_deal as draft.')
assert.match(intents, /create_deal[\s\S]*?deals/, 'ZO_Agent schema/examples must describe create_deal deal output.')

assert.match(actions, /intent === 'create_deal'/, 'confirmAiAssistDraft must handle create_deal.')
assert.match(actions, /\.from\('deals'\)/, 'create_deal confirmation must insert into deals.')
assert.match(actions, /DEAL_STAGES/, 'create_deal confirmation must normalize stages against DEAL_STAGES.')
assert.match(actions, /\/internal\/deals\/\$\{data\.id\}/, 'create_deal should return the deal detail route.')
assert.match(actions, /href = `\/internal\/finance`/, 'create_spending should return an existing finance route.')

assert.match(panel, /AiDraftReviewCard/, 'ZO_Agent panel must render typed draft review cards.')
assert.doesNotMatch(panel, /JSON\.stringify\(draft\.output\.draft, null, 2\)/, 'ZO_Agent must not show raw JSON as the default confirmable draft preview.')
assert.ok(
  panel.indexOf('draft.output.warnings') < panel.indexOf('Confirm &amp; Create Record'),
  'ZO_Agent warnings must appear before the confirm button.'
)
assert.match(panel, /overflow-y-auto/, 'ZO_Agent sheet content must scroll on short mobile screens.')
assert.match(reviewCard, /output\.confidence/, 'ZO_Agent review card must show confidence before confirmation.')
assert.match(reviewCard, /<details/, 'ZO_Agent review card must keep raw draft data behind a collapsed fallback.')
assert.match(reviewCard, /JSON\.stringify\(draft, null, 2\)/, 'ZO_Agent collapsed fallback must expose structured draft data for unknown intents.')
assert.match(migration, /create_deal/, 'Supabase intent check migration must allow create_deal.')

console.log('ZO_Agent action contract OK')
