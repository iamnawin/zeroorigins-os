import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('resource tables are horizontally contained on narrow screens', () => {
  const source = read('src/components/resource-kit/entity-table.tsx')

  assert.match(source, /overflow-x-auto/)
  assert.match(source, /min-w-\[720px\]/)
  assert.match(source, /md:min-w-0/)
})

test('meeting form collapses to one column and full-width actions on mobile', () => {
  const source = read('src/components/forms/MeetingForm.tsx')

  assert.match(source, /w-full max-w-2xl/)
  assert.match(source, /grid grid-cols-1 gap-4 sm:grid-cols-2/)
  assert.match(source, /flex flex-col gap-3 sm:flex-row/)
  assert.match(source, /w-full sm:w-auto/)
})

test('internal page chrome can wrap and stay inside mobile viewport', () => {
  const header = read('src/components/layout/internal-header.tsx')
  const pageHeader = read('src/components/resource-kit/resource-page-header.tsx')
  const layout = read('src/app/(internal)/layout.tsx')

  assert.match(header, /min-h-14/)
  assert.match(header, /flex-wrap/)
  assert.match(header, /overflow-x-auto/)
  assert.match(pageHeader, /flex flex-col gap-3/)
  assert.match(pageHeader, /sm:flex-row/)
  assert.match(layout, /overflow-x-hidden/)
})

test('gateway uses mobile-first spacing and typography', () => {
  const source = read('src/app/page.tsx')

  assert.match(source, /p-4 sm:p-6/)
  assert.match(source, /space-y-10/)
  assert.match(source, /sm:space-y-16/)
  assert.match(source, /text-3xl sm:text-4xl md:text-5xl/)
  assert.match(source, /gap-4/)
  assert.match(source, /sm:gap-6/)
  assert.match(source, /lg:gap-8/)
})
