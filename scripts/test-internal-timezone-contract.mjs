import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const files = [
  'src/app/(internal)/internal/control-room/page.tsx',
  'src/app/(internal)/internal/meetings/page.tsx',
  'src/app/(internal)/internal/meetings/[id]/page.tsx',
  'src/app/(internal)/internal/radar/page.tsx',
  'src/app/(internal)/internal/radar/[id]/page.tsx',
  'src/app/(internal)/internal/radar/events/page.tsx',
  'src/lib/actions/ai-assist.ts',
]

for (const file of files) {
  const source = readFileSync(file, 'utf8')
  assert.match(source, /timeZone:\s*['"]Asia\/Kolkata['"]/, `${file} must format user-facing internal times in IST.`)
}

const controlRoom = readFileSync('src/app/(internal)/internal/control-room/page.tsx', 'utf8')
assert.match(controlRoom, /day:\s*['"]numeric['"][\s\S]*month:\s*['"]short['"]/, 'Control Room status timestamp should render like 20 Jun, 10:27 am.')
assert.match(controlRoom, /hour12:\s*true/, 'Control Room status timestamp should use am/pm format.')

console.log('Internal timezone contract OK')
