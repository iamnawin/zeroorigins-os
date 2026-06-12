#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { SENTINELS } from './lib/migration-sentinels.mjs'

async function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  try {
    const content = await fs.readFile(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
      const [key, ...valueParts] = trimmed.split('=')
      process.env[key] = valueParts.join('=').replace(/^["']|["']$/g, '')
    }
    return true
  } catch {
    return false
  }
}

function hasEnv(name) {
  const value = process.env[name]
  return Boolean(value && value.trim())
}

async function probeColumn(url, key, table, column) {
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
  const ok = hasEnv(name)
  console.log(`${ok ? 'OK' : 'FAIL'} env ${name}`)
  if (!ok) failures++
}

console.log(`${service ? 'OK' : 'WARN'} env SUPABASE_SERVICE_ROLE_KEY${service ? '' : ' not set; internal profile audit will use anon permissions'}`)

if (!url || !key) process.exit(1)

console.log('')
console.log('Schema sentinels')
for (const sentinel of SENTINELS) {
  const result = await probeColumn(url, key, sentinel.table, sentinel.column)
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
