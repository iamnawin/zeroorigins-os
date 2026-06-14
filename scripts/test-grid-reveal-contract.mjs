import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('grid reveal components provide CSS-only staggered motion primitives', () => {
  const component = read('src/components/ui/grid-reveal.tsx')
  const css = read('src/app/globals.css')

  assert.match(component, /export function GridReveal/)
  assert.match(component, /export function GridRevealItem/)
  assert.match(component, /--grid-reveal-delay/)
  assert.match(component, /zo-grid-reveal/)
  assert.match(component, /zo-grid-reveal-item/)

  assert.match(css, /@keyframes zo-grid-reveal/)
  assert.match(css, /translateY\(12px\)/)
  assert.match(css, /scale\(0\.98\)/)
  assert.match(css, /animation-delay: var\(--grid-reveal-delay/)
  assert.match(css, /prefers-reduced-motion: reduce/)
})

test('registry pages wrap real cards with GridReveal without replacing data', () => {
  const applications = read('src/app/(internal)/internal/applications/page.tsx')
  const ideas = read('src/app/(internal)/internal/ideas/page.tsx')
  const verticals = read('src/app/(internal)/internal/business-verticals/page.tsx')

  for (const source of [applications, ideas, verticals]) {
    assert.match(source, /GridReveal/)
    assert.match(source, /GridRevealItem/)
  }

  assert.match(applications, /rows\.map\(\(?app/)
  assert.match(ideas, /group\.items\.map\(\(?idea/)
  assert.match(verticals, /verticals\.map\(\(?vertical/)
})

test('lifecycle cards keep drag behavior while gaining non-conflicting reveal surface', () => {
  const lifecycleCard = read('src/components/lifecycle/DraggableLifecycleCard.tsx')
  const lifecycleColumn = read('src/components/lifecycle/LifecycleColumn.tsx')

  assert.match(lifecycleCard, /draggable/)
  assert.match(lifecycleCard, /isDragging && 'scale-\[1\.02\]/)
  assert.match(lifecycleCard, /zo-grid-reveal-card/)
  assert.match(lifecycleColumn, /GridRevealItem/)
  assert.doesNotMatch(lifecycleColumn, /draggable/)
})
