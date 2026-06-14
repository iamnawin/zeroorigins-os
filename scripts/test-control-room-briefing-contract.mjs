import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('control room is an AI-first business briefing, not a raw admin dashboard', () => {
  const source = read('src/app/(internal)/internal/control-room/page.tsx')

  for (const section of [
    'AI Business Briefing',
    'Business Pulse',
    'Today&apos;s Priorities',
    'Revenue Motion',
    'Team Rhythm',
    'Ask ZeroOrigins Agent',
    'Business Memory',
    'Quick Actions',
  ]) {
    assert.ok(source.includes(section), `Control Room missing ${section}`)
  }

  for (const prompt of [
    'What needs my attention today?',
    'Which leads need follow-up?',
    'What tasks are blocked?',
    'Summarize partner activity.',
    'What should we do next?',
  ]) {
    assert.ok(source.includes(prompt), `Agent prompt missing: ${prompt}`)
  }

  for (const table of ['leads', 'deals', 'proposals', 'meetings', 'tasks', 'finance_transactions', 'ai_assist_requests']) {
    assert.ok(source.includes(`from('${table}')`), `Control Room must reuse ${table} data`)
  }

  assert.ok(source.includes('AiAssistPanel embedded'), 'Control Room must keep the existing embedded agent panel')
  assert.ok(source.includes('Projects without recent activity'), 'Control Room must include project freshness guidance')
  assert.ok(source.includes('No active leads yet'), 'Control Room must show useful empty states')
  assert.doesNotMatch(source, /<table/i, 'Home must avoid raw tables')
})
