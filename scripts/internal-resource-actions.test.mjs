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
  'src/components/forms/VendorForm.tsx',
  'src/components/forms/FinanceTransactionForm.tsx',
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
    'vendors',
    'finance_transactions',
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
    '/internal/finance',
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
    'createVendor',
    'updateVendor',
    'createFinanceTransaction',
    'updateFinanceTransaction',
    'convertLeadToDeal',
    'markProposalAccepted',
    'createProjectFromCustomer',
    'archiveApplication',
    'deleteApplication',
    'createApplication',
    'updateApplication',
  ]) {
    assert.match(source, new RegExp(`export async function ${action}\\b`))
  }
})

test('application registry can be created and edited from internal pages', () => {
  const actions = fs.readFileSync(
    path.join(repoRoot, 'src/lib/actions/internal-resources.ts'),
    'utf8',
  )
  const listPage = fs.readFileSync(
    path.join(repoRoot, 'src/app/(internal)/internal/applications/page.tsx'),
    'utf8',
  )
  const detailPage = fs.readFileSync(
    path.join(repoRoot, 'src/app/(internal)/internal/applications/[id]/page.tsx'),
    'utf8',
  )

  for (const relativePath of [
    'src/components/forms/ApplicationForm.tsx',
    'src/app/(internal)/internal/applications/new/page.tsx',
    'src/app/(internal)/internal/applications/[id]/edit/page.tsx',
  ]) {
    assert.ok(fs.existsSync(path.join(repoRoot, relativePath)), `${relativePath} should exist`)
  }

  const form = fs.readFileSync(
    path.join(repoRoot, 'src/components/forms/ApplicationForm.tsx'),
    'utf8',
  )

  assert.match(actions, /export async function createApplication\b[\s\S]*\.from\('applications'\)[\s\S]*\.insert/)
  assert.match(actions, /export async function updateApplication\b[\s\S]*\.from\('applications'\)[\s\S]*\.update/)
  assert.match(form, /createApplication/)
  assert.match(form, /updateApplication/)
  assert.match(listPage, /newHref=\{`\$\{BASE\}\/new`\}/)
  assert.match(listPage, /newLabel="Add Application"/)
  assert.doesNotMatch(listPage, /showNew=\{false\}/)
  assert.match(detailPage, /\/internal\/applications\/\$\{app\.id\}\/edit/)
})

test('application registry exposes safe archive and delete operations', () => {
  const actions = fs.readFileSync(
    path.join(repoRoot, 'src/lib/actions/internal-resources.ts'),
    'utf8',
  )
  const detailPage = fs.readFileSync(
    path.join(repoRoot, 'src/app/(internal)/internal/applications/[id]/page.tsx'),
    'utf8',
  )
  const dangerActions = fs.readFileSync(
    path.join(repoRoot, 'src/components/internal/application-danger-actions.tsx'),
    'utf8',
  )

  assert.match(actions, /archiveApplication[\s\S]*\.from\('applications'\)[\s\S]*\.update\(\{[\s\S]*status: 'archived'[\s\S]*stage: 'archived'/)
  assert.match(actions, /deleteApplication[\s\S]*\.from\('source_registry'\)[\s\S]*\.delete\(\)[\s\S]*related_application_id/)
  assert.match(actions, /deleteApplication[\s\S]*\.from\('applications'\)[\s\S]*\.delete\(\)/)
  assert.match(detailPage, /ApplicationDangerActions/)
  assert.match(dangerActions, /Archive application/)
  assert.match(dangerActions, /Delete permanently/)
})

test('workspace import does not unarchive archived applications', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'scripts/import-workspace-inventory.mjs'),
    'utf8',
  )

  assert.match(source, /select=id,status,stage/)
  assert.match(source, /existing\[0\]\?\.status === 'archived'/)
  assert.match(source, /status: existing\[0\]\?\.status === 'archived' \? 'archived'/)
  assert.match(source, /stage: existing\[0\]\?\.status === 'archived' \? 'archived'/)
})

test('company spending has internal finance routes and database migration', () => {
  for (const relativePath of [
    'src/app/(internal)/internal/finance/page.tsx',
    'src/app/(internal)/internal/finance/expenses/new/page.tsx',
    'src/app/(internal)/internal/finance/vendors/new/page.tsx',
    'supabase/migrations/011_company_spending.sql',
  ]) {
    assert.ok(fs.existsSync(path.join(repoRoot, relativePath)), `${relativePath} should exist`)
  }

  const migration = fs.readFileSync(path.join(repoRoot, 'supabase/migrations/011_company_spending.sql'), 'utf8')
  assert.match(migration, /create table if not exists vendors/)
  assert.match(migration, /alter table finance_transactions/)
  assert.match(migration, /vendor_id uuid references vendors/)
  assert.match(migration, /status text/)
  assert.match(migration, /recurrence_interval text/)
  assert.match(migration, /invoice_url text/)
  assert.match(migration, /Internal can manage vendors/)
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
