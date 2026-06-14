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
const CRM_VERTICAL_SLUG = 'crm-salesforce-systems'

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

const CRM_IDEA_OVERRIDES = {
  'serviceops-pulse': {
    vertical_slug: CRM_VERTICAL_SLUG,
    next_action: 'Promote to an application once MVP scope is confirmed.',
  },
  'orgtrace': {
    vertical_slug: CRM_VERTICAL_SLUG,
    next_action: 'Keep linked to CRM & Salesforce Systems and attach repo details.',
  },
  'perfect-store-scorecard': {
    vertical_slug: CRM_VERTICAL_SLUG,
    next_action: 'Confirm Salesforce packaging and demo path.',
  },
  'salesforce-automation-packs': {
    vertical_slug: CRM_VERTICAL_SLUG,
    next_action: 'Define the first reusable automation pack.',
  },
  'crm-implementation-accelerators': {
    vertical_slug: CRM_VERTICAL_SLUG,
    next_action: 'Collect reusable delivery assets.',
  },
  'experience-cloud-portal-systems': {
    vertical_slug: CRM_VERTICAL_SLUG,
    next_action: 'Map portal components and reusable templates.',
  },
}

const CRM_APP_OVERRIDES = {
  'serviceops-pulse': {
    name: 'ServiceOps Pulse',
    vertical_slug: CRM_VERTICAL_SLUG,
    stage: 'concept',
    type: 'salesforce_app',
    description: 'Salesforce-integrated service operations monitoring dashboard for support and delivery visibility.',
    next_action: 'Confirm MVP scope and connect source assets.',
  },
  'orgtrace': {
    name: 'OrgTrace',
    vertical_slug: CRM_VERTICAL_SLUG,
    stage: 'production_ready',
    type: 'salesforce_app',
    description: 'Product-ready developer and Salesforce metadata intelligence application.',
    next_action: 'Package the Salesforce metadata intelligence workflow for first demos.',
  },
  'perfect-store-scorecard': {
    name: 'Perfect Store Scorecard',
    vertical_slug: CRM_VERTICAL_SLUG,
    stage: 'prototype',
    type: 'salesforce_app',
    description: 'Retail execution and CRM scorecard product for field audits, store scoring, and follow-up workflows.',
    next_action: 'Validate demo flow and identify Salesforce packaging path.',
  },
  'salesforce-automation-packs': {
    name: 'Salesforce Automation Packs',
    vertical_slug: CRM_VERTICAL_SLUG,
    stage: 'concept',
    type: 'automation',
    description: 'Reusable Salesforce and CRM automation packs for lead follow-up, service workflows, alerts, and reporting.',
    next_action: 'Define first three automation packs and required assets.',
  },
  'crm-implementation-accelerators': {
    name: 'CRM Implementation Accelerators',
    vertical_slug: CRM_VERTICAL_SLUG,
    stage: 'concept',
    type: 'service_product',
    description: 'Templates, scripts, discovery assets, and implementation shortcuts for CRM delivery projects.',
    next_action: 'Collect reusable delivery assets and publish accelerator checklist.',
  },
  'experience-cloud-portal-systems': {
    name: 'Experience Cloud / Portal Systems',
    vertical_slug: CRM_VERTICAL_SLUG,
    stage: 'concept',
    type: 'salesforce_app',
    description: 'Customer and partner portal systems using Salesforce Experience Cloud and connected CRM workflows.',
    next_action: 'Map portal use cases and reusable portal components.',
  },
}

// Repo folder aliases include Perfect-Store-Scorecard from D:\AI-Workspace\Repos.

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
  const slug = slugify(name)
  const stat = statSync(dir)
  const crmOverride = CRM_IDEA_OVERRIDES[slug]
  return {
    name,
    slug,
    local_folder_path: dir,
    vertical_slug: crmOverride?.vertical_slug || inferCrmVerticalSlug(name),
    status: 'raw',
    priority: 'normal',
    source: 'local_folder',
    description: getReadmeSummary(dir) || `Idea concept: ${name}`,
    next_action: crmOverride?.next_action || 'Review and classify idea',
    detected_files: detectFiles(dir),
    readme_summary: getReadmeSummary(dir),
    last_modified: stat.mtime.toISOString(),
    source_tree: buildSourceTree(dir),
  }
}

function scanRepo(dir) {
  const name = basename(dir)
  const slug = slugify(name)
  const stat = statSync(dir)
  const pkg = safeJson(join(dir, 'package.json'))
  const techStack = inferTechStack(dir, pkg)
  const gitRemote = getGitRemote(dir)
  const gitBranch = getGitBranch(dir)
  const docsPath = existsSync(join(dir, 'docs')) ? join(dir, 'docs') : existsSync(join(dir, 'Docs')) ? join(dir, 'Docs') : null
  const crmOverride = CRM_APP_OVERRIDES[slug]

  return {
    name: crmOverride?.name || pkg?.name || name,
    slug,
    local_folder_path: dir,
    vertical_slug: crmOverride?.vertical_slug || inferCrmVerticalSlug(name, techStack),
    stage: crmOverride?.stage || STAGE_OVERRIDES[name] || 'prototype',
    status: 'active',
    type: crmOverride?.type || TYPE_OVERRIDES[name] || 'application',
    description: crmOverride?.description || DESC_OVERRIDES[name] || pkg?.description || getReadmeSummary(dir) || `Application: ${name}`,
    next_action: crmOverride?.next_action || null,
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

function inferCrmVerticalSlug(name, techStack = []) {
  const haystack = `${name} ${techStack.join(' ')}`.toLowerCase()
  return /(salesforce|crm|service cloud|sales cloud|experience cloud|appExchange|orgtrace|serviceops|scorecard)/i.test(haystack)
    ? CRM_VERTICAL_SLUG
    : null
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
