import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const types = readFileSync('src/types/index.ts', 'utf8')
const intents = readFileSync('src/lib/ai/assist-intents.ts', 'utf8')
const actions = readFileSync('src/lib/actions/ai-assist.ts', 'utf8')
const resourceActions = readFileSync('src/lib/actions/internal-resources.ts', 'utf8')
const panel = readFileSync('src/components/ai/AiAssistPanel.tsx', 'utf8')
const deleteButton = readFileSync('src/components/internal/delete-resource-button.tsx', 'utf8')
const reviewCard = readFileSync('src/components/ai/AiDraftReviewCard.tsx', 'utf8')
const dealMigration = readFileSync('supabase/migrations/022_zo_agent_deal_intent.sql', 'utf8')
const leadMigration = readFileSync('supabase/migrations/023_zo_agent_lead_intent.sql', 'utf8')

assert.match(types, /'create_deal'/, 'AiAssistIntent must include create_deal.')
assert.match(types, /'create_lead'/, 'AiAssistIntent must include create_lead.')
assert.match(intents, /intent: 'create_lead'/, 'ZO_Agent quick actions must include create_lead.')
assert.match(intents, /create_lead: 'Create Lead'/, 'Command Center button labels must create leads directly.')
assert.match(intents, /create_lead: 'draft'/, 'ZO_Agent intent modes must mark create_lead as draft.')
assert.match(intents, /Lead Name:[\s\S]*?create_lead/, 'ZO_Agent examples must route structured lead text to create_lead.')
assert.match(intents, /intent: 'create_deal'/, 'ZO_Agent quick actions must include create_deal.')
assert.match(intents, /create_deal: 'Create Deal'/, 'Command Center button labels must create deals directly.')
assert.match(intents, /create_deal: 'draft'/, 'ZO_Agent intent modes must mark create_deal as draft.')
assert.match(intents, /create_deal[\s\S]*?deals/, 'ZO_Agent schema/examples must describe create_deal deal output.')

assert.match(actions, /intent === 'create_deal'/, 'confirmAiAssistDraft must handle create_deal.')
assert.match(actions, /intent === 'create_lead'/, 'confirmAiAssistDraft must handle create_lead.')
assert.match(actions, /\.from\('leads'\)/, 'create_lead confirmation must insert into leads.')
assert.match(actions, /findExistingZoAgentLead/, 'create_lead confirmation must check for an existing matching lead before insert.')
assert.match(actions, /\.maybeSingle\(\)/, 'create_lead de-dupe check should tolerate no existing matching lead.')
assert.match(actions, /leadDetailHref\(createdId\)/, 'create_lead should return the lead detail route.')
assert.match(actions, /revalidatePath\('\/internal\/leads'\)/, 'create_lead must revalidate the leads list.')
assert.match(actions, /missing-email\+/, 'create_lead must tolerate LinkedIn leads without email by using a visible placeholder.')
assert.match(actions, /createServiceClient/, 'ZO_Agent confirmation must use the service client for server-side record creation after auth.')
assert.ok(
  actions.indexOf('await requireInternalUser(supabase)') < actions.indexOf('createServiceClient()'),
  'ZO_Agent confirmation must authenticate the internal user before creating a service-role client.'
)
assert.match(actions, /typed\.message/, 'ZO_Agent errors must expose Supabase object error messages instead of a generic failure.')
assert.match(actions, /\.from\('deals'\)/, 'create_deal confirmation must insert into deals.')
assert.match(actions, /DEAL_STAGES/, 'create_deal confirmation must normalize stages against DEAL_STAGES.')
assert.match(actions, /\/internal\/deals\/\$\{data\.id\}/, 'create_deal should return the deal detail route.')
assert.match(actions, /href = `\/internal\/finance`/, 'create_spending should return an existing finance route.')
assert.match(actions, /runAiAssistCommand/, 'Command Center must expose a one-click run action.')
assert.match(actions, /detectCommandIntents/, 'Command Center must detect multiple requested record types from one message.')
assert.match(actions, /for \(const commandIntent of intents\)/, 'Command Center must execute every detected intent.')
assert.match(actions, /confirmAiAssistDraft\(draft\.data\.id, draft\.data\.output\)/, 'One-click command execution must auto-confirm create drafts.')
assert.match(actions, /legacyMeetingPayload/, 'ZO_Agent meeting creation must fall back when production schema lacks sync columns.')
assert.match(actions, /paid_by: asString\(draft\.paid_by\)/, 'ZO_Agent spending must persist paid_by as a first-class field.')

assert.match(panel, /AiDraftReviewCard/, 'ZO_Agent panel must render typed draft review cards.')
assert.doesNotMatch(panel, /JSON\.stringify\(draft\.output\.draft, null, 2\)/, 'ZO_Agent must not show raw JSON as the default confirmable draft preview.')
assert.ok(
  panel.indexOf('draft.output.warnings') === -1 || panel.indexOf('draft.output.warnings') < panel.indexOf('Created records'),
  'Command Center warnings must appear before created records.'
)
assert.doesNotMatch(panel, /Confirm &amp; Create Record/, 'Command Center must not require a second confirmation click for create actions.')
assert.match(panel, /Command Center/, 'The visible agent surface must be renamed to Command Center.')
assert.match(panel, /runAiAssistCommand/, 'Panel must use the one-click command action.')
assert.match(panel, /overflow-y-auto/, 'ZO_Agent sheet content must scroll on short mobile screens.')
assert.match(panel, /useRouter/, 'ZO_Agent panel must refresh after confirmed record creation.')
assert.doesNotMatch(panel, /router\.push\(primaryHref\)/, 'Command Center must not automatically navigate to a created record detail page.')
assert.match(panel, /router\.refresh\(\)/, 'Command Center should refresh the current page after creating records.')
assert.match(reviewCard, /output\.confidence/, 'ZO_Agent review card must show confidence before confirmation.')
assert.match(reviewCard, /<details/, 'ZO_Agent review card must keep raw draft data behind a collapsed fallback.')
assert.match(reviewCard, /JSON\.stringify\(draft, null, 2\)/, 'ZO_Agent collapsed fallback must expose structured draft data for unknown intents.')
assert.match(dealMigration, /create_deal/, 'Supabase intent check migration must allow create_deal.')
assert.match(leadMigration, /create_lead/, 'Supabase intent check migration must allow create_lead.')

for (const fn of ['deleteLead', 'deleteTask', 'deleteDeal', 'deleteProposal', 'deleteProject', 'deleteBusinessIdea', 'deleteFinanceTransaction']) {
  assert.match(resourceActions, new RegExp(`export async function ${fn}`), `${fn} must exist for records created by Command Center.`)
}
for (const kind of ['lead', 'task', 'deal', 'proposal', 'project', 'idea', 'finance_transaction']) {
  assert.match(deleteButton, new RegExp(`${kind}:`), `DeleteResourceButton must support ${kind}.`)
}

console.log('Command Center action contract OK')
