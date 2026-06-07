# Resource Kit

Shared UI and logic primitives for internal entity pages (ideas, projects, tasks, leads, partners).

## Goal

Eliminate copy-paste duplication across list pages without building a heavy abstraction framework. Every shared piece must justify itself by removing 5+ identical copies.

## Structure

```
src/lib/resource-kit/
  status.ts              — TERMINAL_STATUSES lookup + terminalStatusFilter()

src/components/resource-kit/
  resource-page-header.tsx   — title, description, "New X" button
  resource-view-tabs.tsx     — Active / All filter tabs (URL-driven)
  resource-empty-state.tsx   — empty list message + "View all" link
  resource-status-badge.tsx  — consistent badge: dim for terminal statuses
```

## Components

### ResourcePageHeader

```tsx
<ResourcePageHeader
  title="Leads"
  description="Inbound leads and pipeline"
  newHref="/internal/leads/new"
  newLabel="New Lead"
/>
```

### ResourceViewTabs

```tsx
<ResourceViewTabs basePath="/internal/leads" showAll={showAll} />
```

Renders "Active" and "All" tabs. Active is highlighted with `zo-amber` when `!showAll`.

### ResourceEmptyState

```tsx
<ResourceEmptyState showAll={showAll} basePath="/internal/leads" />
```

Active view empty → "No active records. View all". All view empty → "No records yet."

### ResourceStatusBadge

```tsx
<ResourceStatusBadge status={lead.status} />
```

Replaces underscores with spaces. Dims terminal statuses (`archived`, `rejected`, `cancelled`, `lost`, `done`, `expired`) via `opacity-50`.

## Status helpers

```ts
import { TERMINAL_STATUSES, terminalStatusFilter } from '@/lib/resource-kit/status'

// Use in list page queries:
query.not('status', 'in', terminalStatusFilter('leads'))

// Terminal status lists per entity:
TERMINAL_STATUSES.ideas    // ['archived', 'rejected']
TERMINAL_STATUSES.projects // ['archived', 'cancelled']
TERMINAL_STATUSES.tasks    // ['done', 'cancelled']
TERMINAL_STATUSES.leads    // ['archived', 'lost']
TERMINAL_STATUSES.partners // ['archived', 'rejected']
```

## Adding a new resource module

1. Add terminal statuses to `TERMINAL_STATUSES` in `src/lib/resource-kit/status.ts`
2. Use `ResourcePageHeader`, `ResourceViewTabs`, `ResourceEmptyState`, `ResourceStatusBadge` in the list page
3. Write entity-specific card content inline — don't abstract it unless 3+ entities share the exact same layout
4. Create form component in `src/components/forms/` following the existing pattern

## Anti-overengineering rule

Do **not** create a `createResource(table)` factory, a `ResourceList` generic component, or any higher-order pattern. The current kit removes observable duplication. Additional abstraction buys nothing until there are more than 10 entity types with truly identical layouts.

## What is NOT in the Resource Kit

- Detail page layout (too entity-specific)
- Form components (handled in `src/components/forms/`)
- Supabase query logic (stays in each page — easier to read and debug)
- Edit/create routing (handled per entity)
