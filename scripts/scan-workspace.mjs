#!/usr/bin/env node
/**
 * ZeroOrigins OS — Local Workspace Scanner
 * Scans D:\AI-Workspace\Ideas and D:\AI-Workspace\Repos
 * Outputs zeroorigins-source-inventory.json
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'fs'
import { writeFileSync } from 'fs'
import { join, basename, extname, relative } from 'path'

const IDEAS_ROOT = 'D:\\AI-Workspace\\Ideas'
const REPOS_ROOT = 'D:\\AI-Workspace\\Repos'
const OUTPUT = join(process.cwd(), 'zeroorigins-source-inventory.json')

// Known stage overrides
const STAGE_OVERRIDES = {
  'OrgTrace': 'production_ready',
  'PLOTDNA-AI': 'production_ready',
  'zeroorigins-os': 'live',
}

const TYPE_OVERRIDES = {
  'zeroorigins-os': 'internal_system',
}

const DESC_OVERRIDES = {
  'OrgTrace': 'Product-ready developer/Salesforce metadata intelligence application.',
  'PLOTDNA-AI': 'Product-ready application under ZeroOrigins.',
  'zeroorigins-os': 'Internal operating system for ZeroOrigins.',
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function safeRead(path) {
  try { return readFileSync(path, 'utf8') } catch { return null }
}

function safeJson(path) {
  const raw = safeRead(path)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function getReadmeSummary(dir) {
  const readme = safeRead(join(dir, 'README.md'))
  if (!readme) return null
  return readme.slice(0, 500).split('\n').slice(0, 10).join('\n').trim()
}

function getGitRemote(dir) {
  const config = safeRead(join(dir, '.git', 'config'))
  if (!config) return null
  const match = config.match(/url\s*=\s*(.+)/)
  return match ? match[1].trim() : null
}

function getGitBranch(dir) {
  const head = safeRead(join(dir, '.git', 'HEAD'))
  if (!head) return null
  const match = head.match(/ref: refs\/heads\/(.+)/)
  return match ? match[1].trim() : null
}

function detectFiles(dir) {
  try {
    return readdirSync(dir).filter(f => {
      try { return statSync(join(dir, f)).isFile() } catch { return false }
    })
  } catch { return [] }
}

function inferTechStack(dir, pkg) {
  const stack = []
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) }

  if (deps['next']) stack.push('Next.js')
  if (deps['react']) stack.push('React')
  if (deps['vite']) stack.push('Vite')
  if (deps['typescript'] || existsSync(join(dir, 'tsconfig.json'))) stack.push('TypeScript')
  if (deps['tailwindcss']) stack.push('Tailwind')
  if (deps['@supabase/supabase-js']) stack.push('Supabase')
  if (deps['express']) stack.push('Express')
  if (deps['prisma'] || deps['@prisma/client']) stack.push('Prisma')
  if (existsSync(join(dir, 'sfdx-project.json')) || existsSync(join(dir, 'force-app'))) stack.push('Salesforce')
  if (deps['electron']) stack.push('Electron')
  if (deps['vue']) stack.push('Vue')
  if (deps['svelte']) stack.push('Svelte')

  return stack
}

function buildSourceTree(dir, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return []
  const IGNORE = ['node_modules', '.git', 'dist', 'build', '.next', '.cache', 'out', '__pycache__', '.turbo', 'target', '.vercel']

  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    return entries
      .filter(e => !IGNORE.includes(e.name) && !e.name.startsWith('.'))
      .sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1
        if (!a.isDirectory() && b.isDirectory()) return 1
        return a.name.localeCompare(b.name)
      })
      .map(e => {
        const relPath = relative(dir, join(dir, e.name)).replace(/\\/g, '/')
        if (e.isDirectory()) {
          const children = buildSourceTree(join(dir, e.name), maxDepth, currentDepth + 1)
          return { name: e.name, type: 'folder', path: relPath, children: children.length > 0 ? children : undefined }
        }
        return { name: e.name, type: 'file', path: relPath, extension: extname(e.name) }
      })
  } catch { return [] }
}

function scanIdea(dir) {
  const name = basename(dir)
  const stat = statSync(dir)
  return {
    name,
    slug: slugify(name),
    local_folder_path: dir,
    status: 'raw',
    priority: 'normal',
    source: 'local_folder',
    description: getReadmeSummary(dir) || `Idea concept: ${name}`,
    detected_files: detectFiles(dir),
    readme_summary: getReadmeSummary(dir),
    last_modified: stat.mtime.toISOString(),
    source_tree: buildSourceTree(dir),
  }
}

function scanRepo(dir) {
  const name = basename(dir)
  const stat = statSync(dir)
  const pkg = safeJson(join(dir, 'package.json'))
  const techStack = inferTechStack(dir, pkg)
  const gitRemote = getGitRemote(dir)
  const gitBranch = getGitBranch(dir)
  const docsPath = existsSync(join(dir, 'docs')) ? join(dir, 'docs') : existsSync(join(dir, 'Docs')) ? join(dir, 'Docs') : null

  return {
    name: pkg?.name || name,
    slug: slugify(name),
    local_folder_path: dir,
    stage: STAGE_OVERRIDES[name] || 'prototype',
    status: 'active',
    type: TYPE_OVERRIDES[name] || 'application',
    description: DESC_OVERRIDES[name] || pkg?.description || getReadmeSummary(dir) || `Application: ${name}`,
    tech_stack: techStack,
    package_name: pkg?.name || null,
    framework: techStack[0] || null,
    repo_url: gitRemote,
    docs_folder_path: docsPath,
    website_url: null,
    deployment_url: null,
    database_url: null,
    n8n_workflow_url: null,
    figma_url: null,
    detected_files: detectFiles(dir),
    readme_summary: getReadmeSummary(dir),
    git_branch: gitBranch,
    git_remote: gitRemote,
    last_modified: stat.mtime.toISOString(),
    build_status: null,
    source_tree: buildSourceTree(dir),
  }
}

function main() {
  console.log('🔍 Scanning workspace...')

  const ideas = []
  const applications = []

  if (existsSync(IDEAS_ROOT)) {
    const dirs = readdirSync(IDEAS_ROOT, { withFileTypes: true }).filter(d => d.isDirectory())
    for (const d of dirs) {
      console.log(`  📝 Idea: ${d.name}`)
      ideas.push(scanIdea(join(IDEAS_ROOT, d.name)))
    }
  } else {
    console.log(`  ⚠️  Ideas root not found: ${IDEAS_ROOT}`)
  }

  if (existsSync(REPOS_ROOT)) {
    const dirs = readdirSync(REPOS_ROOT, { withFileTypes: true }).filter(d => d.isDirectory())
    for (const d of dirs) {
      console.log(`  📦 Repo: ${d.name}`)
      applications.push(scanRepo(join(REPOS_ROOT, d.name)))
    }
  } else {
    console.log(`  ⚠️  Repos root not found: ${REPOS_ROOT}`)
  }

  const inventory = {
    generated_at: new Date().toISOString(),
    roots: { ideas: IDEAS_ROOT, repos: REPOS_ROOT },
    ideas,
    applications,
  }

  writeFileSync(OUTPUT, JSON.stringify(inventory, null, 2), 'utf8')
  console.log(`\n✅ Written ${OUTPUT}`)
  console.log(`   Ideas: ${ideas.length}`)
  console.log(`   Applications: ${applications.length}`)
}

main()
