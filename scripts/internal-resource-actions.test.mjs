import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')

const forms = [
  'src/components/forms/LeadForm.tsx',
  'src/components/forms/PartnerForm.tsx',
  'src/components/forms/ProjectForm.tsx',
  'src/components/forms/TaskForm.tsx',
  'src/components/forms/AppForm.tsx',
]

test('internal resource forms mutate through server actions', () => {
  for (const relativePath of forms) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')

    assert.match(
      source,
      /@\/lib\/actions\/internal-resources/,
      `${relativePath} should import internal resource server actions`,
    )
    assert.doesNotMatch(
      source,
      /from\('(?:leads|partners|projects|tasks|ai_workspace_apps)'\)\s*\.\s*(?:insert|update)/,
      `${relativePath} should not directly insert/update internal resources from the browser`,
    )
  }
})

test('internal resource server actions revalidate dashboard and collection pages', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'src/lib/actions/internal-resources.ts'),
    'utf8',
  )

  for (const page of [
    '/internal/control-room',
    '/internal/leads',
    '/internal/partners',
    '/internal/projects',
    '/internal/tasks',
    '/internal/ai-workspace',
  ]) {
    assert.match(source, new RegExp(`['"\`]${page.replaceAll('/', '\\/')}['"\`]`))
  }
})
