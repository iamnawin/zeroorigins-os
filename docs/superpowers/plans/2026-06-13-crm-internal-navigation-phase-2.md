# CRM Internal Navigation Phase 2 Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Keep the branch stacked on Phase 1 until the first three CRM phases are ready to merge.

**Goal:** Make the internal app feel like a practical ZeroOrigins operating system by prioritizing projects, tasks, meetings, knowledge, finance, AI workspace, and current pipeline work over empty customer/partner surfaces.

**Architecture:** Keep Phase 2 mostly UI composition and navigation configuration. Do not add database tables or automate external integrations in this phase. Centralize internal navigation metadata so the top navigation and tests share one source of truth.

**Branch:** `phase/crm-internal-navigation-phase-2`

---

## Task 1: Lock The Navigation Intent

- [ ] Create `src/lib/internal-navigation.ts` with a grouped nav model:
  - `operate`: Control Room, Projects, Tasks, Meetings
  - `sourceOfTruth`: Knowledge, Finance, AI Workspace
  - `pipeline`: Leads, Deals, Proposals
  - `deferred`: Customers, Partners
  - `admin`: Settings
- [ ] Create `scripts/test-internal-navigation.mjs`.
- [ ] Test expectations:
  - Finance and Knowledge are in the source-of-truth group.
  - Customers and Partners are in the deferred group.
  - Customers and Partners are not in the top priority groups.
  - Every nav item has a unique `href`.
- [ ] Add `test:crm-navigation` script to `package.json`.

## Task 2: Rebuild Internal Top Navigation

- [ ] Update `src/components/layout/internal-topnav.tsx` to consume `INTERNAL_NAV_GROUPS`.
- [ ] Show icon+label links for primary internal work.
- [ ] Keep Customers and Partners in a compact deferred section so they remain available but no longer dominate the first navigation row.
- [ ] Keep Finance visible to admins from the main nav, not only the user dropdown.
- [ ] Preserve the account dropdown and sign-out flow.

## Task 3: Improve Empty States

- [ ] Extend `ResourceEmptyState` with optional `title`, `description`, `actionHref`, and `actionLabel`.
- [ ] Update Customers empty state to explain that customer records should be created after real conversion, not as dummy data.
- [ ] Update Partners empty state to keep partner intake available but visually lower priority.
- [ ] Preserve the existing "View all" behavior for filtered inactive/archive views.

## Task 4: Surface Finance And Knowledge From Control Room

- [ ] Add a compact "Source of truth" operating strip to the Control Room.
- [ ] Include Finance, Knowledge, AI Workspace, and Meetings links.
- [ ] Show current spend and upcoming bills from existing finance data.
- [ ] Keep the sales pipeline board present but below internal operations.

## Task 5: Documentation And Verification

- [ ] Update `docs/CONTEXT_HANDOFF.md` with Phase 2 branch, scope, and verification commands.
- [ ] Update `docs/project-status.md` to show internal navigation as the active phase.
- [ ] Run:

```powershell
npm run test:crm-navigation
npm run test:crm-foundation
npm run check:migrations
npm run check:crm
npm run lint
npm run build
```

## Commit Plan

Commit 1: Phase 2 plan and navigation contract test.

Commit 2: internal navigation, empty states, and Control Room source-of-truth strip.

Commit 3: handoff/status docs after verification.

All commits must follow the Lore Commit Protocol.
