#!/usr/bin/env node
/**
 * ZeroOrigins OS — Import Workspace Inventory
 * Reads zeroorigins-source-inventory.json and upserts into Supabase.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

config({ path: join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const INPUT = join(process.cwd(), 'zeroorigins-source-inventory.json')

async function supabase(table, method, body, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`
  const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'resolution=merge-duplicates,return=representation' : 'return=representation',
  }
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${table}: ${res.status} ${text}`)
  }
  return res.json()
}

async function main() {
  console.log('📥 Reading inventory...')
  const raw = readFileSync(INPUT, 'utf8')
  const inventory = JSON.parse(raw)

  const stats = { ideas_created: 0, ideas_updated: 0, apps_created: 0, apps_updated: 0, sources_created: 0, errors: [] }

  // Upsert ideas
  for (const idea of inventory.ideas) {
    try {
      const record = {
        title: idea.name,
        slug: idea.slug,
        description: idea.description,
        status: idea.status || 'raw',
        priority: idea.priority || 'normal',
        source: idea.source || 'local_folder',
        local_folder_path: idea.local_folder_path,
        ai_summary: idea.readme_summary || null,
        next_action: 'Review and classify idea',
      }

      // Check if exists by slug
      const existing = await supabase('business_ideas', 'GET', null, `?slug=eq.${idea.slug}&select=id`)
      if (existing.length > 0) {
        await supabase('business_ideas', 'PATCH', record, `?id=eq.${existing[0].id}`)
        stats.ideas_updated++
      } else {
        await supabase('business_ideas', 'POST', record)
        stats.ideas_created++
      }
    } catch (e) {
      stats.errors.push(`Idea ${idea.name}: ${e.message}`)
    }
  }

  // Upsert applications
  for (const app of inventory.applications) {
    try {
      const record = {
        name: app.name,
        slug: app.slug,
        description: app.description,
        stage: app.stage || 'prototype',
        status: app.status || 'active',
        type: app.type || 'application',
        local_folder_path: app.local_folder_path,
        repo_url: app.repo_url || null,
        docs_folder_path: app.docs_folder_path || null,
        tech_stack: app.tech_stack || [],
        last_synced_at: new Date().toISOString(),
      }

      const existing = await supabase('applications', 'GET', null, `?slug=eq.${app.slug}&select=id`)
      if (existing.length > 0) {
        await supabase('applications', 'PATCH', record, `?id=eq.${existing[0].id}`)
        stats.apps_updated++
      } else {
        await supabase('applications', 'POST', record)
        stats.apps_created++
      }
    } catch (e) {
      stats.errors.push(`App ${app.name}: ${e.message}`)
    }
  }

  // Upsert source_registry entries for each app/idea with local path
  for (const app of inventory.applications) {
    try {
      const appRows = await supabase('applications', 'GET', null, `?slug=eq.${app.slug}&select=id`)
      if (appRows.length === 0) continue
      const appId = appRows[0].id

      const existing = await supabase('source_registry', 'GET', null, `?related_application_id=eq.${appId}&source_type=eq.local_folder&select=id`)
      if (existing.length === 0) {
        await supabase('source_registry', 'POST', {
          name: `${app.name} local folder`,
          source_type: 'local_folder',
          local_path: app.local_folder_path,
          related_application_id: appId,
          status: 'active',
          last_synced_at: new Date().toISOString(),
          metadata_json: { source_tree: app.source_tree, detected_files: app.detected_files, tech_stack: app.tech_stack },
        })
        stats.sources_created++
      }

      // Add repo source if available
      if (app.repo_url) {
        const repoExisting = await supabase('source_registry', 'GET', null, `?related_application_id=eq.${appId}&source_type=eq.repo&select=id`)
        if (repoExisting.length === 0) {
          await supabase('source_registry', 'POST', {
            name: `${app.name} repository`,
            source_type: 'repo',
            source_url: app.repo_url,
            related_application_id: appId,
            status: 'active',
            last_synced_at: new Date().toISOString(),
          })
          stats.sources_created++
        }
      }
    } catch (e) {
      stats.errors.push(`Source ${app.name}: ${e.message}`)
    }
  }

  console.log('\n✅ Import complete')
  console.log(`   Ideas created: ${stats.ideas_created}`)
  console.log(`   Ideas updated: ${stats.ideas_updated}`)
  console.log(`   Apps created: ${stats.apps_created}`)
  console.log(`   Apps updated: ${stats.apps_updated}`)
  console.log(`   Sources created: ${stats.sources_created}`)
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors (${stats.errors.length}):`)
    stats.errors.forEach(e => console.log(`   - ${e}`))
  }
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
