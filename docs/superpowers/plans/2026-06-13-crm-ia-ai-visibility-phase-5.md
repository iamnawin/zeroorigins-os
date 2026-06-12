# CRM IA and AI Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move brands/products into Business Verticals, make AI Workspace only about AI capabilities, and expose controlled AI Assist drafts across the internal OS.

**Architecture:** Add first-party `business_verticals` and `ai_assist_requests` tables, link core records to verticals with nullable foreign keys, and keep all mutations behind existing internal auth server actions. Navigation becomes a compact internal IA: Control Room, Business Verticals, AI Workspace, Automation, Pipeline, Work, Finance, Knowledge, Settings.

**Tech Stack:** Next.js App Router 16 server components/actions, Supabase Postgres/RLS, React client forms, Together AI via the existing `callTogetherChat` helper, node contract tests.

---

## Scope

This is Phase 5 after the CRM foundation, navigation, knowledge hub, and team calendar phases. It must preserve existing data and auth behavior. Existing AI Workspace records are not deleted; likely brand/product records are surfaced as Business Vertical seeds and AI Workspace messaging is changed to capability-oriented.

## File Structure

- Create `supabase/migrations/013_business_verticals_ai_assist.sql`: tables, seed verticals, nullable links, RLS, indexes.
- Modify `scripts/lib/migration-sentinels.mjs`: schema sentinels for Phase 5.
- Create `scripts/test-ia-ai-visibility-contract.mjs`: red/green contract test for navigation, schema sentinels, actions, pages, AI visibility copy, and dark select styling.
- Modify `package.json`: add `test:crm-ia-ai`.
- Modify `src/types/index.ts`: business vertical and AI assist enums/interfaces plus related IDs on core records.
- Modify `src/lib/internal-navigation.ts`: new compact IA groups.
- Modify `src/components/layout/internal-topnav.tsx`: icons for new IA and better overflow behavior.
- Modify `src/lib/actions/internal-resources.ts`: create/update business verticals, add vertical IDs to task/meeting/proposal/finance payloads where practical.
- Modify `src/lib/actions/ai-assist.ts`: create AI Assist draft requests through Together AI; confirm selected draft types into records only after user action.
- Create `src/components/forms/BusinessVerticalForm.tsx`: create/edit vertical form.
- Create `src/components/ai/AiAssistPanel.tsx`: visible drawer/panel with quick actions, structured draft output, confirm/cancel.
- Create `src/lib/ai/assist-intents.ts`: intent definitions and JSON schema prompt helpers.
- Create routes under `src/app/(internal)/internal/business-verticals`: list, new, detail, edit.
- Create `src/app/(internal)/internal/automation/page.tsx`: automation visibility console.
- Modify `src/app/(internal)/internal/ai-workspace/page.tsx`: capability cards only.
- Modify `src/app/(internal)/internal/control-room/page.tsx`: AI Assist panel/status and Business Verticals source link.
- Modify `src/app/globals.css`: dark-safe `select`/`option` styling to fix the white dropdown issue shown in Finance > Vendor.
- Modify docs `docs/CONTEXT_HANDOFF.md` and `docs/project-status.md`: phase state, schema, routes, verification.

## Task 1: Contract Test

- [ ] Add `scripts/test-ia-ai-visibility-contract.mjs`.
- [ ] Assert navigation includes `/internal/business-verticals`, `/internal/ai-workspace`, `/internal/automation`, `/internal/tasks`, `/internal/finance`, `/internal/knowledge`, and `/internal/settings`.
- [ ] Assert AI Workspace page does not use the old “brands, and products” dumping-ground wording and does include Email Intelligence, Task Assistant, Meeting Assistant, Proposal Assistant, Content Assistant, Prompt Lab, Automation Runs, and Model Settings.
- [ ] Assert migration sentinels cover `business_verticals.name`, `business_verticals.slug`, `business_verticals.type`, `business_verticals.status`, `ai_assist_requests.intent`, `ai_assist_requests.ai_output_json`, and `ai_assist_requests.status`.
- [ ] Assert `createBusinessVertical`, `updateBusinessVertical`, `createAiAssistDraft`, and `confirmAiAssistDraft` exports exist.
- [ ] Assert global CSS styles `select option` for dark-safe dropdowns.
- [ ] Run `npm run test:crm-ia-ai`; expected RED before implementation.

## Task 2: Schema and Types

- [ ] Add migration 013 with `business_verticals`, `ai_assist_requests`, seeds, nullable relationship columns, indexes, updated_at triggers, and `is_internal_user()` RLS.
- [ ] Add migration sentinels.
- [ ] Add enums/interfaces in `src/types/index.ts`.
- [ ] Run `npm run test:crm-ia-ai`; expected failures now move from schema/type absence to UI/action absence.

## Task 3: Business Verticals

- [ ] Add server actions for create/update verticals.
- [ ] Add list/detail/new/edit routes and `BusinessVerticalForm`.
- [ ] Detail page sections: Overview, Projects, Tasks, Leads, Content, Automations, Finance, AI Assist.
- [ ] Keep empty states useful because current partner/customer base is sparse.
- [ ] Run `npm run test:crm-ia-ai`; expected remaining AI Workspace/AI Assist failures.

## Task 4: AI Workspace and Automation Visibility

- [ ] Replace AI Workspace data registry wording with capability cards.
- [ ] Add provider/model/status/last run/connected automation/action button fields for the requested eight cards.
- [ ] Add Automation page showing Email Router, Telegram Alert Bot, Calendar Sync, AI Assist activity, and failed outputs requiring review.
- [ ] Keep Together AI connection tester visible in AI Workspace or Model Settings area.
- [ ] Run `npm run test:crm-ia-ai`; expected remaining AI Assist action/UI failures.

## Task 5: AI Assist Drafts

- [ ] Add intent schema/prompt helper for `create_task`, `schedule_meeting`, `draft_email`, `summarize_email`, `create_followup`, `create_proposal`, `classify_lead`, and `summarize_day`.
- [ ] Add `createAiAssistDraft(inputText, intent?)` that calls Together AI, parses JSON, stores `status='draft'`, and never creates downstream records.
- [ ] Add `confirmAiAssistDraft(requestId, editedOutput?)` that creates only supported records after confirmation: task, meeting, proposal, and follow-up task.
- [ ] Add visible `AiAssistPanel` in internal layout so it is available across the app, plus a Control Room embedded panel.
- [ ] Run `npm run test:crm-ia-ai`.

## Task 6: Finance Select Styling and Docs

- [ ] Add global native select option styling so dropdowns do not open as large white blocks in dark mode.
- [ ] Update handoff and project status docs with Phase 5 state and Supabase SQL instructions.
- [ ] Run full verification: `npm run test:crm-ia-ai`, `npm run test:crm-navigation`, `npm run test:crm-knowledge`, `npm run test:crm-team-calendar`, `npm run test:crm-foundation`, `npm run lint`, `npm run build`.
- [ ] Commit with Lore protocol, merge to `main`, push branch and main.

## Self-Review

- No data deletion is planned.
- AI Assist is explicitly draft-first and confirmation-gated.
- Auth stays inside existing `requireInternalUser`.
- Business Verticals own brands/products; AI Workspace owns capabilities/tools.
- Finance vendor dropdown bug is included because it blocks vendor entry in the requested Finance/Vendors flow.
