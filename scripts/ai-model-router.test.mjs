import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')
const routerPath = path.join(repoRoot, 'src/lib/ai/model-router.ts')
const clientPath = path.join(repoRoot, 'src/lib/ai/together-client.ts')
const actionsPath = path.join(repoRoot, 'src/lib/actions/ai-assist.ts')

test('Together AI model router exists and uses current model ids', () => {
  assert.ok(fs.existsSync(routerPath), 'src/lib/ai/model-router.ts should exist')
  const source = fs.readFileSync(routerPath, 'utf8')

  assert.match(source, /Qwen\/Qwen3\.5-9B/)
  assert.match(source, /openai\/gpt-oss-20b/)
  assert.match(source, /openai\/gpt-oss-120b/)
  assert.match(source, /deepseek-ai\/DeepSeek-V4-Pro/)
})

test('Together AI model router defaults simple CRM work to cheap models', () => {
  const source = fs.readFileSync(routerPath, 'utf8')

  for (const task of ['classify_expense', 'extract_bill', 'summarize_meeting', 'draft_next_action']) {
    assert.match(source, new RegExp(`${task}[\\s\\S]{0,160}(Qwen/Qwen3\\.5-9B|openai/gpt-oss-20b)`))
  }
})

test('Together AI model router reserves stronger models for complex work', () => {
  const source = fs.readFileSync(routerPath, 'utf8')

  for (const task of ['proposal_strategy', 'crm_planning', 'complex_reasoning']) {
    assert.match(source, new RegExp(`${task}[\\s\\S]{0,180}(openai/gpt-oss-120b|deepseek-ai/DeepSeek-V4-Pro)`))
  }
})

test('Together AI client keeps the API key server-only and calls chat completions', () => {
  assert.ok(fs.existsSync(clientPath), 'src/lib/ai/together-client.ts should exist')
  const source = fs.readFileSync(clientPath, 'utf8')

  assert.match(source, /import ['"]server-only['"]/)
  assert.match(source, /process\.env\.TOGETHER_API_KEY/)
  assert.doesNotMatch(source, /NEXT_PUBLIC_TOGETHER/)
  assert.match(source, /Authorization/)
  assert.match(source, /Bearer/)
  assert.match(source, /\/chat\/completions/)
  assert.match(source, /reasoning:\s*\{\s*enabled:\s*false\s*\}/)
  assert.match(source, /choices\?\.\[0\]\?\.message\?\.content/)
})

test('AI assist server actions expose meeting and finance helpers', () => {
  assert.ok(fs.existsSync(actionsPath), 'src/lib/actions/ai-assist.ts should exist')
  const source = fs.readFileSync(actionsPath, 'utf8')

  assert.match(source, /'use server'/)
  assert.match(source, /export async function testTogetherConnection\b/)
  assert.match(source, /export async function generateMeetingAiAssist\b/)
  assert.match(source, /export async function generateFinanceAiAssist\b/)
  assert.match(source, /requireInternalUser/)
  assert.match(source, /callTogetherChat/)
  assert.match(source, /revalidatePath\('\/internal\/meetings/)
})

test('AI env example documents the server-only Together key', () => {
  const source = fs.readFileSync(path.join(repoRoot, '.env.local.example'), 'utf8')

  assert.match(source, /^TOGETHER_API_KEY=/m)
  assert.doesNotMatch(source, /NEXT_PUBLIC_TOGETHER_API_KEY/)
})
