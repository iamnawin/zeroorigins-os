# CRM Foundation Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make current CRM save reliability diagnosable by extending schema checks, adding a CRM health check, and documenting the phase state.

**Architecture:** Keep Phase 1 as tooling and documentation. Do not redesign UI or add large modules until the persistence foundation is measurable. Centralize migration sentinel definitions so `check:migrations` and future health checks verify the same database surface.

**Tech Stack:** Node.js ESM scripts, Supabase REST API, Next.js 16 App Router project, Supabase PostgreSQL/RLS.

---

## File Structure

- Create: `scripts/lib/migration-sentinels.mjs`
  - Owns the schema sentinel list for all migrations and form-critical columns.
- Modify: `scripts/check-migrations.mjs`
  - Imports the sentinel list instead of carrying stale inline coverage.
- Create: `scripts/check-crm-health.mjs`
  - Runs environment, schema, and internal profile readiness checks.
- Create: `scripts/test-migration-sentinels.mjs`
  - Lightweight Node assertion test for the sentinel registry.
- Modify: `package.json`
  - Adds `check:crm` and `test:crm-foundation` scripts.
- Modify: `docs/CONTEXT_HANDOFF.md`
  - Records approved CRM direction, active phase, branch, verification commands, and resume instructions.
- Modify: `docs/project-status.md`
  - Corrects current status around CRM foundation and source-of-truth direction.

## Task 1: Lock Migration Sentinel Coverage

- [ ] **Step 1: Write the failing sentinel coverage test**

Create `scripts/test-migration-sentinels.mjs`:

```js
import assert from 'node:assert/strict'
import { SENTINELS } from './lib/migration-sentinels.mjs'

const byMigration = new Map()
for (const sentinel of SENTINELS) {
  if (!byMigration.has(sentinel.migration)) byMigration.set(sentinel.migration, [])
  byMigration.get(sentinel.migration).push(`${sentinel.table}.${sentinel.column}`)
}

for (const migration of [
  '001_initial_schema',
  '002_contact_and_automation_fields',
  '003_proposal_and_customer_fields',
  '003_ai_workspace_apps',
  '005_deals_and_pipeline_links',
  '008_ai_workspace_sync_fields',
  '009_auth_and_workspace_reliability',
  '010_meetings_crm',
  '011_company_spending',
]) {
  assert.ok(byMigration.has(migration), `Missing sentinel coverage for ${migration}`)
}

for (const column of [
  'meetings.scheduled_at',
  'vendors.name',
  'finance_transactions.vendor_id',
  'finance_transactions.recurrence_interval',
  'profiles.status',
  'deals.stage',
  'customers.phone',
]) {
  assert.ok(
    SENTINELS.some(sentinel => `${sentinel.table}.${sentinel.column}` === column),
    `Missing sentinel for ${column}`
  )
}

console.log(`Verified ${SENTINELS.length} CRM migration sentinels.`)
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/test-migration-sentinels.mjs`

Expected before implementation: fails with `ERR_MODULE_NOT_FOUND` for `scripts/lib/migration-sentinels.mjs`.

- [ ] **Step 3: Add centralized sentinel registry**

Create `scripts/lib/migration-sentinels.mjs`:

```js
export const SENTINELS = [
  { migration: '001_initial_schema', table: 'leads', column: 'id' },
  { migration: '001_initial_schema', table: 'profiles', column: 'role' },
  { migration: '002_contact_and_automation_fields', table: 'leads', column: 'automation_status' },
  { migration: '002_contact_and_automation_fields', table: 'partners', column: 'n8n_workflow_id' },
  { migration: '003_proposal_and_customer_fields', table: 'proposals', column: 'service_type' },
  { migration: '003_proposal_and_customer_fields', table: 'customers', column: 'phone' },
  { migration: '003_ai_workspace_apps', table: 'ai_workspace_apps', column: 'id' },
  { migration: '005_deals_and_pipeline_links', table: 'deals', column: 'stage' },
  { migration: '005_deals_and_pipeline_links', table: 'proposals', column: 'deal_id' },
  { migration: '005_deals_and_pipeline_links', table: 'projects', column: 'customer_id' },
  { migration: '008_ai_workspace_sync_fields', table: 'ai_workspace_apps', column: 'folder_group' },
  { migration: '009_auth_and_workspace_reliability', table: 'profiles', column: 'status' },
  { migration: '010_meetings_crm', table: 'meetings', column: 'scheduled_at' },
  { migration: '010_meetings_crm', table: 'meetings', column: 'attendees' },
  { migration: '011_company_spending', table: 'vendors', column: 'name' },
  { migration: '011_company_spending', table: 'finance_transactions', column: 'vendor_id' },
  { migration: '011_company_spending', table: 'finance_transactions', column: 'recurrence_interval' },
]
```

- [ ] **Step 4: Update migration checker**

Modify `scripts/check-migrations.mjs` to import `SENTINELS`:

```js
import { SENTINELS } from './lib/migration-sentinels.mjs'
```

Remove the old inline `SENTINELS` array.

- [ ] **Step 5: Run test and migration check**

Run:

```powershell
node scripts/test-migration-sentinels.mjs
npm run check:migrations
```

Expected: sentinel test passes; migration check reports applied or identifies missing remote schema.

## Task 2: Add CRM Health Check

- [ ] **Step 1: Create health check script**

Create `scripts/check-crm-health.mjs` with:

```js
#!/usr/bin/env node

import { SENTINELS } from './lib/migration-sentinels.mjs'

async function loadEnv() {
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const envPath = path.join(process.cwd(), '.env.local')
  try {
    const content = await fs.readFile(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
      const [key, ...valueParts] = trimmed.split('=')
      process.env[key] = valueParts.join('=').replace(/^["']|["']$/g, '')
    }
  } catch {
    return false
  }
  return true
}

function requireEnv(name) {
  const value = process.env[name]
  return Boolean(value && value.trim())
}

async function probe(url, key, table, column) {
  const res = await fetch(`${url}/rest/v1/${table}?select=${column}&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (res.ok) return { ok: true }
  const body = await res.json().catch(() => ({}))
  return { ok: false, status: res.status, body }
}

async function fetchInternalProfiles(url, key) {
  const res = await fetch(
    `${url}/rest/v1/profiles?select=email,role,status&role=in.(admin,employee)&order=email.asc`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  )
  if (!res.ok) return { ok: false, status: res.status, body: await res.text() }
  return { ok: true, rows: await res.json() }
}

await loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const key = service || anon
let failures = 0

console.log('CRM foundation health check')
console.log('')

for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
  const ok = requireEnv(name)
  console.log(`${ok ? 'OK' : 'FAIL'} env ${name}`)
  if (!ok) failures++
}

console.log(`${service ? 'OK' : 'WARN'} env SUPABASE_SERVICE_ROLE_KEY${service ? '' : ' not set; internal profile audit will use anon permissions'}`)

if (!url || !key) process.exit(1)

console.log('')
console.log('Schema sentinels')
for (const sentinel of SENTINELS) {
  const result = await probe(url, key, sentinel.table, sentinel.column)
  console.log(`${result.ok ? 'OK' : 'FAIL'} ${sentinel.migration}: ${sentinel.table}.${sentinel.column}`)
  if (!result.ok) failures++
}

console.log('')
console.log('Internal profiles')
const profiles = await fetchInternalProfiles(url, key)
if (profiles.ok) {
  const active = profiles.rows.filter(row => row.status === 'active')
  console.log(`OK found ${profiles.rows.length} internal profile(s), ${active.length} active`)
  for (const row of profiles.rows) {
    console.log(`- ${row.email}: ${row.role}/${row.status}`)
  }
  if (active.length === 0) {
    console.log('FAIL no active admin/employee profile can save internal CRM records')
    failures++
  }
} else {
  console.log(`WARN could not audit internal profiles: ${profiles.status} ${profiles.body}`)
}

console.log('')
if (failures > 0) {
  console.log(`${failures} CRM foundation check(s) failed.`)
  process.exit(1)
}
console.log('CRM foundation checks passed.')
```

- [ ] **Step 2: Add package scripts**

Modify `package.json`:

```json
"check:crm": "node scripts/check-crm-health.mjs",
"test:crm-foundation": "node scripts/test-migration-sentinels.mjs"
```

- [ ] **Step 3: Run health checks**

Run:

```powershell
npm run test:crm-foundation
npm run check:crm
```

Expected: test passes; health check either passes or identifies concrete Supabase/profile setup issues.

## Task 3: Documentation And Handoff

- [ ] **Step 1: Update `docs/CONTEXT_HANDOFF.md`**

Add:

```md
## 2026-06-13 CRM source-of-truth implementation

Active branch: `phase/crm-foundation-phase-1`
Approved design: `docs/superpowers/specs/2026-06-13-zeroorigins-crm-source-of-truth-design.md`
Phase 1 plan: `docs/superpowers/plans/2026-06-13-crm-foundation-phase-1.md`
Current phase: Foundation and save reliability.
Next phase after push: Internal navigation and empty-state redesign.
```

- [ ] **Step 2: Update `docs/project-status.md`**

State that the current priority is CRM source-of-truth reliability, not visual polish.

- [ ] **Step 3: Verify**

Run:

```powershell
npm run lint
npm run build
```

Expected: both commands exit 0 before the phase is committed and pushed.

## Commit Plan

Commit 1: CRM design/spec and Phase 1 plan.

Commit 2: migration sentinel and health check scripts.

Commit 3: handoff/status docs after verification.

Each commit should use the Lore Commit Protocol from `AGENTS.md`.
