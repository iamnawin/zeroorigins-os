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

const COMPANY_DOC_SOURCES = [
  {
    name: 'ZeroOrigins Company Docs & Policies',
    slug: 'zeroorigins',
    local_folder_path: join(REPOS_ROOT, 'zeroorigins'),
    category: 'company_policy',
    vertical_slug: 'zeroorigins-internal',
    tags: ['zeroorigins', 'company-docs', 'policy', 'brand', 'website'],
    description: 'Company documentation, policy material, brand identity, strategy packs, website files, and operating-system documents for ZeroOrigins.',
  },
]

const COMPANY_DOC_SLUGS = new Set(COMPANY_DOC_SOURCES.map(source => source.slug))

const VERTICAL_SOURCE_ROOTS = [
  {
    name: 'IgnAIte Institute Source Library',
    slug: 'ignaite-institute-source-library',
    local_folder_path: 'D:\\AI-Workspace\\ignAIte',
    vertical_slug: 'ignaite',
    category: 'course_material',
    tags: ['ignaite', 'institute', 'course', 'brochure', 'workshop'],
    description: 'IgnAIte institute source material including course pages, brochures, workshop pages, offer documents, markdown, PDFs, and HTML collateral.',
  },
]

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

function stripMarkdown(text) {
  if (!text) return null
  return text
    .replace(/<[^>]+>/g, '')           // strip HTML tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // strip images
    .replace(/\[[^\]]*\]\([^)]*\)/g, '$1') // links to text
    .replace(/^#{1,6}\s+/gm, '')       // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1')     // italic
    .replace(/`([^`]+)`/g, '$1')       // inline code
    .replace(/```[\s\S]*?```/g, '')    // code blocks
    .replace(/\n{3,}/g, '\n\n')        // excess newlines
    .trim()
}

function safeJson(path) {
  const raw = safeRead(path)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function getReadmeSummary(dir) {
  const readme = safeRead(join(dir, 'README.md'))
  if (!readme) return null
  const clean = stripMarkdown(readme.slice(0, 800))
  // Return first meaningful line (skip empty)
  const lines = clean.split('\n').filter(l => l.trim().length > 10)
  return lines.slice(0, 3).join(' ').slice(0, 200).trim() || null
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

function detectDocumentFiles(dir, max = 40) {
  const allowed = new Set(['.md', '.html', '.pdf', '.docx', '.txt', '.json'])
  const found = []

  function walk(current) {
    if (found.length >= max) return
    let entries = []
    try { entries = readdirSync(current, { withFileTypes: true }) } catch { return }

    for (const entry of entries) {
      if (found.length >= max) return
      if (entry.name.startsWith('.') || ['node_modules', '.git', '.next', 'dist', 'build'].includes(entry.name)) continue
      const fullPath = join(current, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }
      if (allowed.has(extname(entry.name).toLowerCase())) {
        found.push(relative(dir, fullPath).replace(/\\/g, '/'))
      }
    }
  }

  walk(dir)
  return found
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

function scanKnowledgeSource(source) {
  const stat = statSync(source.local_folder_path)
  return {
    ...source,
    source_type: 'docs',
    detected_files: detectDocumentFiles(source.local_folder_path),
    readme_summary: getReadmeSummary(source.local_folder_path),
    last_modified: stat.mtime.toISOString(),
    source_tree: buildSourceTree(source.local_folder_path),
  }
}

function main() {
  console.log('🔍 Scanning workspace...')

  const ideas = []
  const applications = []
  const knowledgeSources = []
  const verticalSources = []

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
      if (COMPANY_DOC_SLUGS.has(slugify(d.name))) continue
      applications.push(scanRepo(join(REPOS_ROOT, d.name)))
    }
  } else {
    console.log(`  ⚠️  Repos root not found: ${REPOS_ROOT}`)
  }

  for (const source of COMPANY_DOC_SOURCES) {
    if (!existsSync(source.local_folder_path)) continue
    console.log(`  Company docs: ${source.name}`)
    knowledgeSources.push(scanKnowledgeSource(source))
  }

  for (const source of VERTICAL_SOURCE_ROOTS) {
    if (!existsSync(source.local_folder_path)) continue
    console.log(`  Vertical source: ${source.name}`)
    verticalSources.push(scanKnowledgeSource(source))
  }

  const inventory = {
    generated_at: new Date().toISOString(),
    roots: { ideas: IDEAS_ROOT, repos: REPOS_ROOT, ignaite: 'D:\\AI-Workspace\\ignAIte' },
    ideas,
    applications,
    knowledgeSources,
    verticalSources,
  }

  writeFileSync(OUTPUT, JSON.stringify(inventory, null, 2), 'utf8')
  console.log(`\n✅ Written ${OUTPUT}`)
  console.log(`   Ideas: ${ideas.length}`)
  console.log(`   Applications: ${applications.length}`)
  console.log(`   Knowledge sources: ${knowledgeSources.length}`)
  console.log(`   Vertical sources: ${verticalSources.length}`)
}

main()
