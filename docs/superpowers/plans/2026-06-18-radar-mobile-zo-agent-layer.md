# Radar Mobile UX + ZO_Agent Action Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Intelligence Radar mobile-first and make ZO_Agent reliably create confirmed finance, idea, and deal records from natural-language requests.

**Architecture:** Keep Radar inside the existing App Router and Resource Kit patterns, with focused responsive component changes instead of a new design system. Extend the existing ZO_Agent intent registry and `confirmAiAssistDraft` server action so the agent remains a draft-confirm-create workflow, not an auto-writer.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, Supabase, Together AI, Node contract tests.

---

## Requirements Summary

- Radar must be usable first on a phone: readable cards, touch-friendly filters, compact metrics, and no horizontal overflow.
- Radar should expose RSS sources, daily cron status, manual sync, and clear empty/error/sync states.
- ZO_Agent must replace raw JSON previews with user-friendly confirmation cards for draft actions.
- ZO_Agent should support natural-language creation of spending/bills, ideas, and deals, using explicit user confirmation before database writes.
- Document this roadmap in `CLAUDE.md` so later agents preserve the mobile-first and agent-action priorities.

## Current Code Facts

- Radar dashboard lives in `src/app/(internal)/internal/radar/page.tsx`.
- Mobile stats currently use `grid grid-cols-3 gap-3 sm:grid-cols-6` at `src/app/(internal)/internal/radar/page.tsx:64`.
- Radar filters currently use a wrap-heavy chip row at `src/app/(internal)/internal/radar/page.tsx:80`.
- Radar cards switch from one column to two/three columns at `src/app/(internal)/internal/radar/page.tsx:134`.
- Radar item rendering lives in `src/components/radar/radar-item-card.tsx:32`.
- The internal shell already has mobile navigation at `src/components/layout/internal-header.tsx:102`.
- ZO_Agent is globally mounted at `src/app/(internal)/layout.tsx:27`.
- ZO_Agent currently shows draft output as raw JSON at `src/components/ai/AiAssistPanel.tsx:187`.
- ZO_Agent already has `create_spending` in `src/lib/ai/assist-intents.ts:9` and writes it through `src/lib/actions/ai-assist.ts:464`.
- ZO_Agent already writes `create_idea` drafts into `business_ideas` at `src/lib/actions/ai-assist.ts:537`.
- Deal creation exists as ordinary server actions in `src/lib/actions/internal-resources.ts:624`, but no ZO_Agent `create_deal` intent is registered yet.

## Acceptance Criteria

- At 390px viewport width, `/internal/radar` has no horizontal overflow and all primary actions remain reachable.
- Radar metrics are compact and stable on phones.
- Radar filters are not an unbounded wall of chips on phones; primary filters are visible and secondary filters are collapsed.
- Radar cards remain single-column on mobile, with title, status, source, score, and date visible without overlapping.
- Radar has a manual RSS sync entry point and source-health context from the dashboard.
- ZO_Agent draft confirmation no longer shows raw JSON for common creation intents.
- "add spending 5000 INR for Gmail paid by Srikar" produces a spending draft and confirm creates a `finance_transactions` row.
- "capture idea for AI invoice parser" produces an idea draft and confirm creates a `business_ideas` row.
- "create a deal for Acme website rebuild worth 80000 INR next step send proposal" produces a deal draft and confirm creates a `deals` row.
- Contract tests prove Radar mobile layout and ZO_Agent action wiring stay connected.

## Implementation Steps

### Task 1: Add Contract Coverage Before UI Changes

**Files:**
- Create: `scripts/test-radar-mobile-contract.mjs`
- Create: `scripts/test-zo-agent-actions-contract.mjs`
- Modify: `package.json`

- [ ] Add static assertions for phone-safe Radar layout, compact filters, and stable card structure.
- [ ] Add static assertions that `create_spending`, `create_idea`, and `create_deal` exist in the intent registry and confirmation action.
- [ ] Add `test:radar-mobile` and `test:zo-agent-actions` scripts.
- [ ] Run both tests and verify the ZO_Agent action test fails before `create_deal` exists.

### Task 2: Make Radar Dashboard Phone-First

**Files:**
- Modify: `src/app/(internal)/internal/radar/page.tsx`
- Modify: `src/components/radar/radar-item-card.tsx`
- Potentially create: `src/components/radar/radar-filter-bar.tsx`
- Potentially create: `src/components/radar/radar-stats-strip.tsx`

- [ ] Replace cramped mobile stats with a stable phone layout, while keeping the six-card desktop row dense.
- [ ] Keep primary filters visible: Active, All, New, Saved.
- [ ] Move category filters behind a compact mobile control while retaining chips on wider screens.
- [ ] Keep `Events ->`, `Content Ideas ->`, and `Sources ->` reachable on mobile.
- [ ] Update `RadarItemCard` spacing and metadata layout so badges, scores, source, and date cannot collide.

### Task 3: Add Radar Operational Context

**Files:**
- Modify: `src/app/(internal)/internal/radar/page.tsx`
- Reuse: `src/components/radar/rss-sync-button.tsx`
- Reuse or extend: `src/lib/radar/queries.ts`

- [ ] Surface active RSS source count, daily cron schedule, and latest signal date if available.
- [ ] Add manual "Sync RSS" near the Radar header or status row by reusing `RssSyncButton`.
- [ ] Add mobile-friendly empty state copy for zero-result filters.
- [ ] Keep the Radar rule intact: no auto-publishing to LinkedIn, Instagram, or X.

### Task 4: Replace Raw ZO_Agent Draft JSON With Typed Review Cards

**Files:**
- Modify: `src/components/ai/AiAssistPanel.tsx`
- Potentially create: `src/components/ai/AiDraftReviewCard.tsx`

- [ ] Render typed preview cards for `create_spending`, `create_idea`, `create_deal`, `create_task`, and `schedule_meeting`.
- [ ] Keep raw JSON behind a collapsed fallback for unknown intents.
- [ ] Show warnings and confidence above the confirm button.
- [ ] Ensure the sheet is full-width on phones and does not hide required actions below the fold.

### Task 5: Add `create_deal` To ZO_Agent

**Files:**
- Modify: `src/lib/ai/assist-intents.ts`
- Modify: `src/lib/actions/ai-assist.ts`
- Reference: `src/lib/actions/internal-resources.ts:624`
- Reference: `src/components/forms/DealForm.tsx`

- [ ] Add `create_deal` to the intent type, quick actions, button labels, mode map, confirmable intent list, schema, and prompt examples.
- [ ] Implement a `create_deal` confirmation branch that writes to `deals`.
- [ ] Normalize deal stage before insert.
- [ ] If a lead/company cannot be matched safely, create the deal without `lead_id` and preserve the text in notes.
- [ ] Return `/internal/deals/${data.id}` after successful creation.

### Task 6: Harden Existing Spending And Idea Actions

**Files:**
- Modify: `src/lib/actions/ai-assist.ts`
- Modify: `src/lib/ai/assist-intents.ts`

- [ ] Confirm `create_spending` links to a valid route; use `/internal/finance` until a finance detail page exists.
- [ ] Normalize finance category, status, type, date, and currency before insert.
- [ ] Preserve `paid_by` in notes when there is no dedicated column.
- [ ] Confirm `create_idea` writes to `business_ideas`, not legacy `ideas`.

### Task 7: Verify And Deploy

- [ ] Run `pnpm test:radar-mobile`.
- [ ] Run `pnpm test:zo-agent-actions`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build`.
- [ ] Manually check `/internal/radar` at phone and desktop widths.
- [ ] Manually test ZO_Agent draft/confirm for spending, idea, and deal in a safe environment.
- [ ] Push commits with Lore commit messages.
- [ ] After Vercel deploy, verify production Radar still shows RSS items and manual sync is callable by an admin.

## Risks And Mitigations

- **Natural language extraction can be wrong.** Keep explicit confirmation and show typed fields before writes.
- **Deal lead matching can create bad relationships.** Do not guess a `lead_id`; only link on a strong match.
- **Mobile filters can hide categories.** Keep primary filters visible and make the secondary filter control obvious.
- **Radar ingest can time out on Vercel.** Keep daily cron and make manual sync report progress/failure clearly.
- **Supabase Preview migrations still have drift risk.** Run migration sentinels when schema changes are added.

## Verification Commands

```powershell
pnpm test:radar-mobile
pnpm test:zo-agent-actions
pnpm lint
pnpm build
```
