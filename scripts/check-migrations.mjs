#!/usr/bin/env node

// Detects drift between supabase/migrations/ and the remote database by
// probing one sentinel column (or table) introduced by each migration via
// the PostgREST API. Column checks happen before RLS, so the anon key is
// sufficient. Exit code 1 if any migration appears unapplied.

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load environment variables from .env.local
try {
  const envPath = path.join(path.dirname(__dirname), '.env.local')
  const envContent = await fs.readFile(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '')
      process.env[key.trim()] = value.trim()
    }
  }
} catch {
  console.log('No .env.local file found or error reading it')
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('Requires NEXT_PUBLIC_SUPABASE_URL and an API key in .env.local')
  process.exit(1)
}

// One sentinel probe per migration: { migration, table, column }
// column = null means "table exists" is the sentinel.
const SENTINELS = [
  { migration: '001_initial_schema', table: 'leads', column: 'id' },
  { migration: '002_contact_and_automation_fields', table: 'leads', column: 'automation_status' },
  { migration: '003_proposal_and_customer_fields', table: 'proposals', column: 'service_type' },
  { migration: '003_ai_workspace_apps', table: 'ai_workspace_apps', column: 'id' },
  { migration: '005_deals_and_pipeline_links', table: 'deals', column: 'id' },
  { migration: '008_ai_workspace_sync_fields', table: 'ai_workspace_apps', column: 'folder_group' },
  { migration: '009_auth_and_workspace_reliability', table: 'profiles', column: 'status' },
]

async function probe(table, column) {
  const res = await fetch(`${url}/rest/v1/${table}?select=${column}&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (res.ok) return true
  const body = await res.json().catch(() => ({}))
  // 42703 = column missing, PGRST205 = table missing
  if (body.code === '42703' || body.code === 'PGRST205') return false
  throw new Error(`Unexpected response probing ${table}.${column}: ${res.status} ${JSON.stringify(body)}`)
}

console.log(`Checking remote schema: ${url}`)
console.log('')

let missing = 0
for (const { migration, table, column } of SENTINELS) {
  try {
    const applied = await probe(table, column)
    console.log(`${applied ? '✅' : '❌'} ${migration}${applied ? '' : `  (missing: ${table}.${column})`}`)
    if (!applied) missing++
  } catch (err) {
    console.log(`⚠️  ${migration}  (probe failed: ${err.message})`)
    missing++
  }
}

console.log('')
if (missing > 0) {
  console.log(`${missing} migration(s) appear UNAPPLIED on the remote database.`)
  console.log('Fix: paste the missing files from supabase/migrations/ into the')
  console.log('Supabase SQL editor for this project, in numeric order.')
  process.exit(1)
}
console.log('Remote schema is in sync with supabase/migrations/.')
