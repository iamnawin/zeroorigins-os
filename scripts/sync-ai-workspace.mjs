#!/usr/bin/env node
/**
 * AI Workspace Folder Sync Script
 * Scans D:\AI-Workspace and upserts records into the ai_workspace_apps table.
 *
 * Usage:
 *   node scripts/sync-ai-workspace.mjs
 *   node scripts/sync-ai-workspace.mjs --dry-run
 *
 * Env:
 *   AI_WORKSPACE_ROOT    (default: D:\AI-Workspace)
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import fs from 'fs'
import path from 'path'

const DRY_RUN = process.argv.includes('--dry-run')
const ROOT = process.env.AI_WORKSPACE_ROOT || 'D:\\AI-Workspace'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Folders that map directly to folder_group
const GROUP_FOLDERS = [
  'Ideas', 'Experiments', 'Projects', 'Repos', 'Tools',
  'Media', 'Video-Outputs', 'Delivered', 'Live', 'Backups', 'Sandbox', 'Temp'
]

// Known brand folders at top-level
const BRAND_FOLDERS = [
  'Alwithnobrain Audio Labs', 'Alwithnobrain Stuff', 'EpicsToYou'
]

// Ignore these inside app folders
const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', '.turbo',
  'coverage', '.cache', '__pycache__', '.venv', 'target'
])

// Group → default category/status mapping
const GROUP_DEFAULTS = {
  Ideas: { category: 'idea', status: 'idea' },
  Experiments: { category: 'experimental', status: 'idea' },
  Projects: { category: 'internal_tool', status: 'in_progress' },
  Repos: { category: 'repo', status: 'active' },
  Tools: { category: 'internal_tool', status: 'active' },
  Media: { category: 'media', status: 'active' },
  'Video-Outputs': { category: 'media', status: 'active' },
  Delivered: { category: 'delivered', status: 'delivered' },
  Live: { category: 'live', status: 'live' },
  Backups: { category: 'internal_tool', status: 'archived' },
  Sandbox: { category: 'experimental', status: 'idea' },
  Temp: { category: 'experimental', status: 'idea' },
  Brands: { category: 'brand', status: 'active' },
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function detectAppType(appPath) {
  const has = (f) => fs.existsSync(path.join(appPath, f))
  if (has('next.config.ts') || has('next.config.js') || has('next.config.mjs')) return 'nextjs_app'
  if (has('vite.config.ts') || has('vite.config.js') || has('vite.config.mjs')) return 'vite_app'
  if (has('sfdx-project.json')) return 'salesforce_app'
  if (has('pyproject.toml') || has('requirements.txt')) return 'python_app'
  if (has('package.json')) return 'node_app'
  if (has('README.md') && !has('package.json')) return 'documentation_or_concept'
  // Check parent group for media
  return 'workspace_folder'
}

function readMetaOverride(appPath) {
  const metaPath = path.join(appPath, 'zo.meta.json')
  if (!fs.existsSync(metaPath)) return null
  try {
    const raw = fs.readFileSync(metaPath, 'utf-8')
    return JSON.parse(raw)
  } catch { return null }
}

function extractUrlsFromPackageJson(appPath) {
  const pkgPath = path.join(appPath, 'package.json')
  if (!fs.existsSync(pkgPath)) return {}
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    const urls = {}
    if (pkg.homepage) urls.website_url = pkg.homepage
    if (pkg.repository?.url) urls.github_url = pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '')
    return urls
  } catch { return {} }
}

function buildRecord(name, appPath, folderGroup) {
  const defaults = GROUP_DEFAULTS[folderGroup] || GROUP_DEFAULTS.Repos
  let appType = detectAppType(appPath)
  if (['Media', 'Video-Outputs'].includes(folderGroup)) appType = 'media_project'

  const record = {
    name,
    slug: slugify(name),
    local_path: appPath,
    folder_group: folderGroup,
    category: defaults.category,
    status: defaults.status,
    app_type: appType,
    is_live: folderGroup === 'Live',
    is_delivered: folderGroup === 'Delivered',
    is_internal_tool: !['Live', 'Delivered', 'Brands'].includes(folderGroup),
    is_client_demo: false,
    is_sellable_product: false,
    is_open_source: false,
    last_synced_at: new Date().toISOString(),
  }

  if (folderGroup === 'Repos') record.repo_path = appPath

  // Extract URLs from package.json
  const pkgUrls = extractUrlsFromPackageJson(appPath)
  Object.assign(record, pkgUrls)

  // Apply zo.meta.json overrides
  const meta = readMetaOverride(appPath)
  if (meta) {
    const allowed = [
      'name', 'status', 'category', 'app_type', 'description', 'github_url',
      'vercel_url', 'live_url', 'prototype_url', 'website_url', 'brand_url',
      'target_user', 'business_value', 'monetization_idea', 'is_internal_tool',
      'is_client_demo', 'is_sellable_product', 'is_open_source', 'is_live',
      'is_delivered', 'priority', 'next_action', 'current_issue', 'owner'
    ]
    for (const key of allowed) {
      if (meta[key] !== undefined) record[key] = meta[key]
    }
    // Re-slug if name changed
    if (meta.name) record.slug = slugify(meta.name)
  }

  return record
}

function scanWorkspace() {
  if (!fs.existsSync(ROOT)) {
    console.error(`ERROR: AI_WORKSPACE_ROOT not found: ${ROOT}`)
    process.exit(1)
  }

  const records = []
  const entries = fs.readdirSync(ROOT, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (IGNORE_DIRS.has(entry.name)) continue

    const entryPath = path.join(ROOT, entry.name)

    // Known group folders → scan children
    if (GROUP_FOLDERS.includes(entry.name)) {
      const children = fs.readdirSync(entryPath, { withFileTypes: true })
      for (const child of children) {
        if (!child.isDirectory()) continue
        if (IGNORE_DIRS.has(child.name)) continue
        const childPath = path.join(entryPath, child.name)
        records.push(buildRecord(child.name, childPath, entry.name))
      }
    }
    // Known brand folders → single record
    else if (BRAND_FOLDERS.includes(entry.name)) {
      records.push(buildRecord(entry.name, entryPath, 'Brands'))
    }
    // Skip special top-level non-app folders
    // (AGENTS, AI_WORKSPACE_RULES, CLAUDE are config, not apps)
  }

  return records
}

async function upsertToSupabase(records) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('\nERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    console.error('Set these env vars to write to the database.')
    console.error('You can still use --dry-run without them.\n')
    process.exit(1)
  }

  const url = `${SUPABASE_URL}/rest/v1/ai_workspace_apps`
  let upserted = 0
  let errors = 0

  for (const record of records) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(record),
    })

    if (res.ok) {
      upserted++
    } else {
      errors++
      const text = await res.text()
      console.error(`  FAIL: ${record.name} → ${res.status} ${text}`)
    }
  }

  return { upserted, errors }
}

// --- Main ---
console.log(`\n🔍 AI Workspace Sync`)
console.log(`   Root: ${ROOT}`)
console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE UPSERT'}\n`)

const records = scanWorkspace()

console.log(`Found ${records.length} apps:\n`)
for (const r of records) {
  const flags = [
    r.is_live && '🟢 live',
    r.is_delivered && '📦 delivered',
  ].filter(Boolean).join(' ')
  console.log(`  [${r.folder_group}] ${r.name} (${r.app_type}) ${flags}`)
}

if (DRY_RUN) {
  console.log(`\n✅ Dry run complete. ${records.length} records detected. No writes made.\n`)
  process.exit(0)
}

// Check for slug uniqueness constraint - need to add slug to upsert
// Supabase needs a unique constraint on slug for merge-duplicates to work.
// We'll use local_path as the conflict target instead via custom approach.
// Actually use ON CONFLICT by adding the unique constraint expectation:
// For now, we delete-and-insert by matching slug.

console.log(`\nUpserting ${records.length} records...`)
const { upserted, errors } = await upsertToSupabase(records)
console.log(`\n✅ Done. Upserted: ${upserted}, Errors: ${errors}\n`)
