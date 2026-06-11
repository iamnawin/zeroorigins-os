#!/usr/bin/env node

import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// Configuration
const AI_WORKSPACE_ROOT = process.env.AI_WORKSPACE_ROOT || 'D:\\AI-Workspace'
const DRY_RUN = process.argv.includes('--dry-run')

// Supabase client
let supabase = null
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Folder group mappings
const FOLDER_GROUPS = {
  'Ideas': 'Ideas',
  'Experiments': 'Experiments', 
  'Projects': 'Projects',
  'Repos': 'Repos',
  'Tools': 'Tools',
  'Media': 'Media',
  'Video-Outputs': 'Video-Outputs',
  'Delivered': 'Delivered',
  'Live': 'Live',
  'Backups': 'Backups',
  'Sandbox': 'Sandbox',
  'Temp': 'Temp',
  'Brands': 'Brands'
}

// Brand folders (top-level brand directories)
const BRAND_FOLDERS = [
  'AIwithnobrain Audio Labs',
  'AIwithnobrain Stuff',
  'EpicsToYou'
]

// Ignore these folders/files
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.turbo',
  'coverage',
  '.cache',
  'AGENTS',
  'AI_WORKSPACE_RULES',
  'CLAUDE'
]

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function detectAppType(appPath) {
  try {
    const files = fsSync.readdirSync(appPath)
    
    if (files.includes('next.config.js') || files.includes('next.config.ts')) {
      return 'nextjs_app'
    }
    if (files.some(f => f.startsWith('vite.config'))) {
      return 'vite_app'
    }
    if (files.includes('package.json')) {
      return 'node_app'
    }
    if (files.includes('sfdx-project.json')) {
      return 'salesforce_app'
    }
    if (files.includes('pyproject.toml') || files.includes('requirements.txt')) {
      return 'python_app'
    }
    if (files.includes('README.md') && files.length <= 5) {
      return 'documentation_or_concept'
    }
    
    return 'workspace_folder'
  } catch {
    return 'workspace_folder'
  }
}

async function loadMetadataOverride(appPath) {
  try {
    const metaPath = path.join(appPath, 'zo.meta.json')
    const content = await fs.readFile(metaPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

async function extractUrlsFromPackageJson(appPath) {
  try {
    const packagePath = path.join(appPath, 'package.json')
    const content = await fs.readFile(packagePath, 'utf-8')
    const pkg = JSON.parse(content)
    return {
      homepage: pkg.homepage,
      repository: typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url
    }
  } catch {
    return {}
  }
}

async function extractUrlsFromReadme(appPath) {
  try {
    const readmePath = path.join(appPath, 'README.md')
    const content = await fs.readFile(readmePath, 'utf-8')
    const limitedContent = content.slice(0, 2000) // Limit to first 2000 chars
    
    const urls = {}
    const httpMatches = limitedContent.match(/https?:\/\/[^\s)]+/g) || []
    
    for (const url of httpMatches.slice(0, 3)) { // Max 3 URLs
      if (url.includes('github.com')) {
        urls.github_url = url
      } else if (url.includes('vercel.app') || url.includes('netlify.app')) {
        urls.vercel_url = url
      } else if (!urls.website_url) {
        urls.website_url = url
      }
    }
    
    return urls
  } catch {
    return {}
  }
}

function mapFolderToCategory(folderGroup) {
  switch (folderGroup) {
    case 'Ideas': return 'idea'
    case 'Experiments': return 'experimental'
    case 'Projects': return 'saas_product'
    case 'Repos': return 'repo'
    case 'Tools': return 'internal_tool'
    case 'Media': case 'Video-Outputs': return 'media'
    case 'Delivered': return 'delivered'
    case 'Live': return 'live'
    case 'Brands': return 'brand'
    default: return 'internal_tool'
  }
}

function mapFolderToStatus(folderGroup) {
  switch (folderGroup) {
    case 'Ideas': return 'idea'
    case 'Experiments': return 'planned'
    case 'Projects': return 'in_progress'
    case 'Repos': return 'active'
    case 'Delivered': return 'delivered'
    case 'Live': return 'live'
    case 'Brands': return 'active'
    default: return 'active'
  }
}

async function scanDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    return entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(entry => entry.name)
  } catch (error) {
    console.log(`Warning: Could not scan directory ${dirPath}:`, error.message)
    return []
  }
}

async function scanWorkspace() {
  console.log(`AI Workspace root: ${AI_WORKSPACE_ROOT}`)

  const rootExists = await fs.access(AI_WORKSPACE_ROOT).then(() => true).catch(() => false)
  console.log(`Root exists: ${rootExists}`)
  if (!rootExists) {
    throw new Error(`Workspace directory not found: ${AI_WORKSPACE_ROOT}`)
  }

  const apps = []
  const topLevelDirs = await scanDirectory(AI_WORKSPACE_ROOT)
  const foundGroups = topLevelDirs.filter(d => FOLDER_GROUPS[d] || BRAND_FOLDERS.includes(d))
  console.log(`Found groups: ${foundGroups.join(', ') || '(none)'}`)

  for (const dirName of topLevelDirs) {
    if (IGNORE_PATTERNS.includes(dirName)) continue

    const dirPath = path.join(AI_WORKSPACE_ROOT, dirName)
    
    // Handle brand folders (top-level brand directories)
    if (BRAND_FOLDERS.includes(dirName)) {
      const metadata = await loadMetadataOverride(dirPath)
      const packageUrls = await extractUrlsFromPackageJson(dirPath)
      const readmeUrls = await extractUrlsFromReadme(dirPath)
      
      apps.push({
        name: dirName === 'AIwithnobrain Audio Labs' ? 'AIwithNoBrain Audio Labs' : dirName,
        slug: generateSlug(dirName),
        local_path: dirPath,
        repo_path: dirPath,
        folder_group: 'Brands',
        category: 'brand',
        app_type: detectAppType(dirPath),
        status: 'active',
        priority: 'medium',
        is_internal_tool: false,
        is_client_demo: false,
        is_sellable_product: true,
        is_open_source: false,
        is_live: false,
        is_delivered: false,
        ...packageUrls,
        ...readmeUrls,
        ...metadata,
        last_synced_at: new Date().toISOString()
      })
      continue
    }

    // Handle standard folder groups
    if (FOLDER_GROUPS[dirName]) {
      const folderGroup = FOLDER_GROUPS[dirName]
      const subDirs = await scanDirectory(dirPath)
      
      for (const subDir of subDirs) {
        if (IGNORE_PATTERNS.includes(subDir)) continue
        
        const appPath = path.join(dirPath, subDir)
        const metadata = await loadMetadataOverride(appPath)
        const packageUrls = await extractUrlsFromPackageJson(appPath)
        const readmeUrls = await extractUrlsFromReadme(appPath)
        
        const app = {
          name: subDir,
          slug: generateSlug(subDir),
          local_path: appPath,
          repo_path: appPath,
          folder_group: folderGroup,
          category: mapFolderToCategory(folderGroup),
          app_type: detectAppType(appPath),
          status: mapFolderToStatus(folderGroup),
          priority: 'medium',
          is_internal_tool: folderGroup === 'Tools',
          is_client_demo: false,
          is_sellable_product: ['Projects', 'Delivered', 'Live'].includes(folderGroup),
          is_open_source: false,
          is_live: folderGroup === 'Live',
          is_delivered: folderGroup === 'Delivered',
          ...packageUrls,
          ...readmeUrls,
          ...metadata,
          last_synced_at: new Date().toISOString()
        }
        
        apps.push(app)
      }
    }
  }

  return apps
}

async function syncToDatabase(apps) {
  if (!supabase) {
    const missing = []
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    console.error(`❌ Database sync aborted. Missing in .env.local: ${missing.join(', ')}`)
    console.error('   Dry-run still works: pnpm sync:workspace --dry-run')
    return false
  }

  console.log(`💾 Syncing ${apps.length} apps to database...`)

  let upserted = 0
  let failed = 0
  for (const app of apps) {
    try {
      const { error } = await supabase
        .from('ai_workspace_apps')
        .upsert(app, {
          onConflict: 'slug',
          ignoreDuplicates: false
        })

      if (error) {
        failed++
        console.log(`❌ Error syncing ${app.name}:`, error.message)
      } else {
        upserted++
        console.log(`✅ Synced: ${app.name}`)
      }
    } catch (error) {
      failed++
      console.log(`❌ Error syncing ${app.name}:`, error.message)
    }
  }

  console.log(`\nRecords upserted: ${upserted}`)
  console.log(`Records failed: ${failed}`)
  return failed === 0
}

async function main() {
  console.log('🌱 AI Workspace Sync')
  console.log('===================')
  
  try {
    const apps = await scanWorkspace()

    console.log(`Detected records: ${apps.length}`)
    console.log(`Dry run: ${DRY_RUN}`)
    console.log(`\n📊 Found ${apps.length} apps:`)
    
    // Group by folder group for display
    const grouped = apps.reduce((acc, app) => {
      const group = app.folder_group || 'Other'
      if (!acc[group]) acc[group] = []
      acc[group].push(app)
      return acc
    }, {})
    
    for (const [group, groupApps] of Object.entries(grouped)) {
      console.log(`\n  ${group} (${groupApps.length}):`)
      for (const app of groupApps) {
        console.log(`    • ${app.name} [${app.status}] - ${app.app_type}`)
      }
    }
    
    if (DRY_RUN) {
      console.log('\n🔍 Dry run complete - no database writes performed.')
    } else {
      const synced = await syncToDatabase(apps)
      if (!synced) {
        process.exitCode = 1
        return
      }
      console.log('\n✅ Sync complete!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
