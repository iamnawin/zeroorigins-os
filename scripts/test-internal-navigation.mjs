import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/lib/internal-navigation.ts', import.meta.url), 'utf8')
const hrefs = [...source.matchAll(/href: '([^']+)'/g)].map(match => match[1])
const uniqueHrefs = new Set(hrefs)

assert.equal(uniqueHrefs.size, hrefs.length, 'Every internal navigation href must be unique')
for (const href of hrefs) {
  assert.ok(href.startsWith('/internal/'), `Internal nav href must stay inside /internal: ${href}`)
}

assert.match(source, /id: 'truth'[\s\S]*href: '\/internal\/knowledge'/, 'Knowledge must stay in the Knowledge navigation group')
assert.match(source, /id: 'finance'[\s\S]*href: '\/internal\/finance'/, 'Finance must stay in the Finance navigation group')
assert.match(source, /id: 'pipeline'[\s\S]*href: '\/internal\/customers'/, 'Customers must stay in the Pipeline group')
assert.match(source, /id: 'pipeline'[\s\S]*href: '\/internal\/partners'/, 'Partners must stay in the Pipeline group')

for (const groupId of ['command', 'work', 'automate', 'finance', 'truth']) {
  const groupStart = source.indexOf(`id: '${groupId}'`)
  assert.notEqual(groupStart, -1, `Missing ${groupId} navigation group`)
  const nextGroupStart = source.indexOf("id: '", groupStart + 1)
  const groupSource = source.slice(groupStart, nextGroupStart === -1 ? undefined : nextGroupStart)
  assert.ok(!groupSource.includes("href: '/internal/customers'"), 'Customers must stay in Pipeline navigation')
  assert.ok(!groupSource.includes("href: '/internal/partners'"), 'Partners must stay in Pipeline navigation')
}

const groupCount = [...source.matchAll(/id: '[^']+'/g)].length
console.log(`Verified ${groupCount} internal navigation groups and ${hrefs.length} links.`)
