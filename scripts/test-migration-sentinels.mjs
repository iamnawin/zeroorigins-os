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
