#!/usr/bin/env node
/**
 * ZeroOrigins OS - Import Workspace Inventory
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
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const INPUT = join(process.cwd(), 'zeroorigins-source-inventory.json')

async function supabase(table, method, body, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: method === 'POST' ? 'resolution=merge-duplicates,return=representation' : 'return=representation',
  }
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${table}: ${res.status} ${text}`)
  }
  return res.json()
}

async function main() {
  console.log('Reading inventory...')
  const raw = readFileSync(INPUT, 'utf8')
  const inventory = JSON.parse(raw)

  const stats = {
    ideas_created: 0,
    ideas_updated: 0,
    apps_created: 0,
    apps_updated: 0,
    knowledge_created: 0,
    knowledge_updated: 0,
    sources_created: 0,
    sources_updated: 0,
    archived_apps: 0,
    errors: [],
  }

  for (const idea of inventory.ideas) {
    try {
      const record = {
        title: idea.name,
        slug: idea.slug,
        description: idea.description,
        vertical_id: await verticalIdForSlug(idea.vertical_slug),
        status: idea.status || 'raw',
        priority: idea.priority || 'normal',
        source: idea.source || 'local_folder',
        local_folder_path: idea.local_folder_path,
        ai_summary: idea.readme_summary || null,
        next_action: idea.next_action || 'Review and classify idea',
      }

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

  for (const app of inventory.applications) {
    try {
      const existing = await supabase('applications', 'GET', null, `?slug=eq.${app.slug}&select=id,status,stage`)
      const isArchived = existing[0]?.status === 'archived'
      const record = {
        name: app.name,
        slug: app.slug,
        description: app.description,
        vertical_id: await verticalIdForSlug(app.vertical_slug),
        stage: isArchived ? 'archived' : (app.stage || 'prototype'),
        status: isArchived ? 'archived' : (app.status || 'active'),
        type: app.type || 'application',
        local_folder_path: app.local_folder_path,
        repo_url: app.repo_url || null,
        docs_folder_path: app.docs_folder_path || null,
        tech_stack: app.tech_stack || [],
        next_action: app.next_action || null,
        last_synced_at: new Date().toISOString(),
      }

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

  for (const source of inventory.knowledgeSources || []) {
    try {
      await archiveMisclassifiedApplication(source.slug, stats)

      const category = source.category || 'company_policy'
      const title = source.name
      const record = {
        title,
        category,
        tags: source.tags || ['source-sync'],
        content: sourceContent(source),
      }
      const existing = await supabase('knowledge_articles', 'GET', null, `?title=eq.${encodeURIComponent(title)}&category=eq.${encodeURIComponent(category)}&select=id`)
      if (existing.length > 0) {
        await supabase('knowledge_articles', 'PATCH', record, `?id=eq.${existing[0].id}`)
        stats.knowledge_updated++
      } else {
        await supabase('knowledge_articles', 'POST', record)
        stats.knowledge_created++
      }

      const verticalId = await verticalIdForSlug(source.vertical_slug)
      await upsertSourceRegistry({
        name: `${source.name} source folder`,
        source_type: 'docs',
        local_path: source.local_folder_path,
        related_vertical_id: verticalId,
        status: 'active',
        last_synced_at: new Date().toISOString(),
        notes: source.description,
        metadata_json: sourceMetadata(source),
      }, stats)
    } catch (e) {
      stats.errors.push(`Knowledge source ${source.name}: ${e.message}`)
    }
  }

  for (const source of inventory.verticalSources || []) {
    try {
      const verticalId = await verticalIdForSlug(source.vertical_slug)
      await upsertSourceRegistry({
        name: `${source.name} source folder`,
        source_type: 'docs',
        local_path: source.local_folder_path,
        related_vertical_id: verticalId,
        status: 'active',
        last_synced_at: new Date().toISOString(),
        notes: source.description,
        metadata_json: sourceMetadata(source),
      }, stats)

      const category = source.category || 'course_material'
      const title = `${source.name} Index`
      const record = {
        title,
        category,
        tags: source.tags || ['source-sync'],
        content: sourceContent(source),
      }
      const existing = await supabase('knowledge_articles', 'GET', null, `?title=eq.${encodeURIComponent(title)}&category=eq.${encodeURIComponent(category)}&select=id`)
      if (existing.length > 0) {
        await supabase('knowledge_articles', 'PATCH', record, `?id=eq.${existing[0].id}`)
        stats.knowledge_updated++
      } else {
        await supabase('knowledge_articles', 'POST', record)
        stats.knowledge_created++
      }
    } catch (e) {
      stats.errors.push(`Vertical source ${source.name}: ${e.message}`)
    }
  }

  console.log('\nImport complete')
  console.log(`   Ideas created: ${stats.ideas_created}`)
  console.log(`   Ideas updated: ${stats.ideas_updated}`)
  console.log(`   Apps created: ${stats.apps_created}`)
  console.log(`   Apps updated: ${stats.apps_updated}`)
  console.log(`   Knowledge created: ${stats.knowledge_created}`)
  console.log(`   Knowledge updated: ${stats.knowledge_updated}`)
  console.log(`   Sources created: ${stats.sources_created}`)
  console.log(`   Sources updated: ${stats.sources_updated}`)
  console.log(`   Archived misclassified apps: ${stats.archived_apps}`)
  if (stats.errors.length > 0) {
    console.log(`\nErrors (${stats.errors.length}):`)
    stats.errors.forEach(e => console.log(`   - ${e}`))
  }
}

async function archiveMisclassifiedApplication(slug, stats) {
  if (!slug) return
  const existing = await supabase('applications', 'GET', null, `?slug=eq.${encodeURIComponent(slug)}&select=id,status,stage`)
  if (existing.length === 0 || existing[0].status === 'archived') return

  await supabase('applications', 'PATCH', {
    status: 'archived',
    stage: 'archived',
    last_synced_at: new Date().toISOString(),
    notes: 'Archived by workspace import because this folder is classified as company knowledge, not an application.',
  }, `?id=eq.${existing[0].id}`)
  stats.archived_apps++
}

async function verticalIdForSlug(slug) {
  if (!slug) return null
  const rows = await supabase('business_verticals', 'GET', null, `?slug=eq.${encodeURIComponent(slug)}&select=id`)
  return rows[0]?.id ?? null
}

async function upsertSourceRegistry(record, stats) {
  const filters = []
  if (record.related_vertical_id) filters.push(`related_vertical_id=eq.${record.related_vertical_id}`)
  if (record.related_application_id) filters.push(`related_application_id=eq.${record.related_application_id}`)
  if (record.local_path) filters.push(`local_path=eq.${encodeURIComponent(record.local_path)}`)
  if (record.source_url) filters.push(`source_url=eq.${encodeURIComponent(record.source_url)}`)
  filters.push(`source_type=eq.${encodeURIComponent(record.source_type)}`)

  const existing = await supabase('source_registry', 'GET', null, `?${filters.join('&')}&select=id`)
  if (existing.length > 0) {
    await supabase('source_registry', 'PATCH', record, `?id=eq.${existing[0].id}`)
    stats.sources_updated++
  } else {
    await supabase('source_registry', 'POST', record)
    stats.sources_created++
  }
}

function sourceMetadata(source) {
  return {
    slug: source.slug,
    category: source.category,
    vertical_slug: source.vertical_slug,
    tags: source.tags || [],
    source_tree: source.source_tree || [],
    detected_files: source.detected_files || [],
  }
}

function sourceContent(source) {
  const files = source.detected_files || []
  const fileList = files.length > 0
    ? files.slice(0, 40).map(file => `- ${file}`).join('\n')
    : '- No document files detected yet.'

  return [
    source.description || `${source.name} source library.`,
    '',
    `Local folder: ${source.local_folder_path}`,
    `Vertical: ${source.vertical_slug || 'unassigned'}`,
    `Category: ${source.category || 'source'}`,
    '',
    'Detected files:',
    fileList,
  ].join('\n')
}

main().catch(e => { console.error('Import failed:', e.message); process.exit(1) })
