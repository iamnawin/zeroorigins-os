import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SENTINELS } from './lib/migration-sentinels.mjs'

for (const column of [
  'knowledge_articles.title',
  'knowledge_articles.content',
  'knowledge_articles.category',
  'knowledge_articles.tags',
]) {
  assert.ok(
    SENTINELS.some(sentinel => `${sentinel.table}.${sentinel.column}` === column),
    `Missing knowledge sentinel for ${column}`
  )
}

const actionsSource = await readFile(new URL('../src/lib/actions/internal-resources.ts', import.meta.url), 'utf8')
for (const action of ['createKnowledgeArticle', 'updateKnowledgeArticle']) {
  assert.ok(actionsSource.includes(`export async function ${action}(`), `Missing ${action} server action`)
}

console.log('Verified knowledge source-of-truth contract.')
