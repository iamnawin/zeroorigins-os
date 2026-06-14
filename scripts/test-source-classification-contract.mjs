import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('workspace scanner separates company docs and vertical sources from applications', () => {
  const scanner = read('scripts/scan-workspace.mjs')

  assert.match(scanner, /COMPANY_DOC_SOURCES/)
  assert.match(scanner, /verticalSources/)
  assert.match(scanner, /knowledgeSources/)
  assert.match(scanner, /D:\\\\AI-Workspace\\\\ignAIte/)
  assert.match(scanner, /slug: 'zeroorigins'/)
  assert.match(scanner, /category: 'company_policy'/)
  assert.match(scanner, /vertical_slug: 'ignaite'/)
  assert.match(scanner, /if \(COMPANY_DOC_SLUGS\.has\(slugify\(d\.name\)\)\) continue/)
  assert.match(scanner, /applications,\s*\n\s*knowledgeSources,\s*\n\s*verticalSources,/)
})

test('workspace importer moves classified docs into knowledge and vertical source registry', () => {
  const importer = read('scripts/import-workspace-inventory.mjs')

  assert.match(importer, /knowledgeSources/)
  assert.match(importer, /verticalSources/)
  assert.match(importer, /archiveMisclassifiedApplication/)
  assert.match(importer, /knowledge_articles/)
  assert.match(importer, /company_policy/)
  assert.match(importer, /business_verticals/)
  assert.match(importer, /related_vertical_id/)
  assert.match(importer, /source_registry/)
  assert.match(importer, /metadata_json/)
})

test('knowledge category list exposes company policies and vertical collateral', () => {
  const types = read('src/types/index.ts')
  const form = read('src/components/forms/KnowledgeArticleForm.tsx')

  assert.match(types, /'company_policy'/)
  assert.match(types, /'brand_collateral'/)
  assert.match(types, /'course_material'/)
  assert.match(form, /company_policy/)
})

test('business vertical detail page shows linked source folders', () => {
  const page = read('src/app/(internal)/internal/business-verticals/[id]/page.tsx')

  assert.match(page, /source_registry/)
  assert.match(page, /related_vertical_id/)
  assert.match(page, /Source Folders/)
  assert.match(page, /metadata_json/)
})

test('application cards and detail headers highlight public app URLs', () => {
  const list = read('src/app/(internal)/internal/applications/page.tsx')
  const detail = read('src/app/(internal)/internal/applications/[id]/page.tsx')

  assert.match(list, /primaryAppUrl/)
  assert.match(list, /Open site/)
  assert.match(list, /app\.website_url \|\| app\.deployment_url/)
  assert.match(detail, /primaryAppUrl/)
  assert.match(detail, /Open website/)
  assert.match(detail, /app\.website_url \|\| app\.deployment_url/)
})
