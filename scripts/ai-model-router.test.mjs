import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')
const routerPath = path.join(repoRoot, 'src/lib/ai/model-router.ts')

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
