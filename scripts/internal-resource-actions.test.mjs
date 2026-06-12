import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')

const forms = [
  'src/components/forms/LeadForm.tsx',
  'src/components/forms/PartnerForm.tsx',
  'src/components/forms/ProjectForm.tsx',
  'src/components/forms/TaskForm.tsx',
  'src/components/forms/AppForm.tsx',
  'src/components/forms/IdeaForm.tsx',
  'src/components/forms/CustomerForm.tsx',
  'src/components/forms/ProposalForm.tsx',
  'src/components/forms/DealForm.tsx',
  'src/components/forms/MeetingForm.tsx',
]

test('internal resource forms mutate through server actions', () => {
  const directMutationTables = [
    'leads',
    'partners',
    'projects',
    'tasks',
    'ai_workspace_apps',
    'ideas',
    'customers',
    'proposals',
    'deals',
    'meetings',
  ].join('|')

  for (const relativePath of forms) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')

    assert.match(
      source,
      /@\/lib\/actions\/internal-resources/,
      `${relativePath} should import internal resource server actions`,
    )
    assert.doesNotMatch(
      source,
      new RegExp(`from\\('(?:${directMutationTables})'\\)\\s*\\.\\s*(?:insert|update)`),
      `${relativePath} should not directly insert/update internal resources from the browser`,
    )
  }
})

test('internal resource server actions revalidate dashboard and collection pages', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'src/lib/actions/internal-resources.ts'),
    'utf8',
  )

  for (const page of [
    '/internal/control-room',
    '/internal/leads',
    '/internal/partners',
    '/internal/projects',
    '/internal/tasks',
    '/internal/ai-workspace',
    '/internal/ideas',
    '/internal/customers',
    '/internal/proposals',
    '/internal/deals',
    '/internal/meetings',
  ]) {
    assert.match(source, new RegExp(`['"\`]${page.replaceAll('/', '\\/')}['"\`]`))
  }
})

test('internal resource server actions expose CRM workflow operations', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'src/lib/actions/internal-resources.ts'),
    'utf8',
  )

  for (const action of [
    'createIdea',
    'updateIdea',
    'createCustomer',
    'updateCustomer',
    'createProposal',
    'updateProposal',
    'createDeal',
    'updateDeal',
    'createMeeting',
    'updateMeeting',
    'convertLeadToDeal',
    'markProposalAccepted',
    'createProjectFromCustomer',
  ]) {
    assert.match(source, new RegExp(`export async function ${action}\\b`))
  }
})

test('deals and meetings have internal CRM routes and database migration', () => {
  for (const relativePath of [
    'src/app/(internal)/internal/deals/page.tsx',
    'src/app/(internal)/internal/deals/new/page.tsx',
    'src/app/(internal)/internal/deals/[id]/page.tsx',
    'src/app/(internal)/internal/deals/[id]/edit/page.tsx',
    'src/app/(internal)/internal/meetings/page.tsx',
    'src/app/(internal)/internal/meetings/new/page.tsx',
    'src/app/(internal)/internal/meetings/[id]/page.tsx',
    'src/app/(internal)/internal/meetings/[id]/edit/page.tsx',
    'supabase/migrations/010_meetings_crm.sql',
  ]) {
    assert.ok(fs.existsSync(path.join(repoRoot, relativePath)), `${relativePath} should exist`)
  }

  const migration = fs.readFileSync(path.join(repoRoot, 'supabase/migrations/010_meetings_crm.sql'), 'utf8')
  assert.match(migration, /create table if not exists meetings/)
  assert.match(migration, /lead_id uuid references leads/)
  assert.match(migration, /deal_id uuid references deals/)
  assert.match(migration, /project_id uuid references projects/)
  assert.match(migration, /Internal can manage meetings/)
})
