import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/lib/internal-navigation.ts', import.meta.url), 'utf8')
const hrefs = [...source.matchAll(/href: '([^']+)'/g)].map(match => match[1])
const uniqueHrefs = new Set(hrefs)

assert.equal(uniqueHrefs.size, hrefs.length, 'Every internal navigation href must be unique')
for (const href of hrefs) {
  assert.ok(href.startsWith('/internal/'), `Internal nav href must stay inside /internal: ${href}`)
}

assert.match(source, /id: 'sourceOfTruth'[\s\S]*href: '\/internal\/knowledge'/, 'Knowledge must be source-of-truth navigation')
assert.match(source, /id: 'sourceOfTruth'[\s\S]*href: '\/internal\/finance'/, 'Finance must be source-of-truth navigation')
assert.match(source, /id: 'deferred'[\s\S]*href: '\/internal\/customers'/, 'Customers must be deferred while no customer base exists')
assert.match(source, /id: 'deferred'[\s\S]*href: '\/internal\/partners'/, 'Partners must be deferred while no partner base exists')

for (const groupId of ['operate', 'sourceOfTruth']) {
  const groupStart = source.indexOf(`id: '${groupId}'`)
  assert.notEqual(groupStart, -1, `Missing ${groupId} navigation group`)
  const nextGroupStart = source.indexOf("id: '", groupStart + 1)
  const groupSource = source.slice(groupStart, nextGroupStart === -1 ? undefined : nextGroupStart)
  assert.ok(!groupSource.includes("href: '/internal/customers'"), 'Customers must not dominate primary internal navigation')
  assert.ok(!groupSource.includes("href: '/internal/partners'"), 'Partners must not dominate primary internal navigation')
}

const groupCount = [...source.matchAll(/id: '[^']+'/g)].length
console.log(`Verified ${groupCount} internal navigation groups and ${hrefs.length} links.`)
