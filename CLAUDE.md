# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> ⚠️ The `@AGENTS.md` import above is critical: this repo pins **Next.js 16 / React 19**, which has breaking changes vs. older versions. Read `node_modules/next/dist/docs/` before writing Next.js code rather than relying on prior knowledge.

## Commands

Package manager is **pnpm** (not npm/yarn).

- `pnpm dev` — start dev server (Next.js, Turbopack)
- `pnpm build` — production build
- `pnpm start` — serve production build
- `pnpm lint` — ESLint (`eslint-config-next`)
- `pnpm sync:workspace --dry-run` — preview AI Workspace sync, no writes
- `pnpm sync:workspace` — upsert AI Workspace folders to database
- `pnpm check:migrations` — sentinel-column probe against remote DB
- `node --test scripts/sync-ai-workspace.test.mjs` — sync script tests
- `node --test scripts/test-voice-agent-contract.mjs` — voice agent contract tests

There is **no test runner configured** — do not assume `pnpm test` exists.

## Architecture

ZeroOrigins OS is an internal operating system / CRM for an AI services studio: an internal team manages ideas → projects → tasks, plus a sales pipeline (leads → proposals → customers) and a partner program. External customers and partners get scoped portals. Built on **Next.js App Router + Supabase (Postgres, Auth, RLS)**.

### Three audiences, enforced at two layers

Access control is enforced **both** in middleware (routing) **and** in Postgres RLS (data). Route groups under `src/app/` map to audiences:

- `(internal)` → `/internal/*` — the team. Roles: `admin`, `employee` (`INTERNAL_ROLES` in `src/types/index.ts`).
- `(portal)` → `/portal/customer/*` and `/portal/partner/*` — external `CUSTOMER`, `PARTNER`, `REFERRAL_PARTNER`.
- `(public)` → `/request-build`, `/partner-with-us` — unauthenticated lead/partner intake forms.
- `(auth)` → `/login`, `/signup`, `/forgot-password`.

`src/proxy.ts` (Next.js 16 edge proxy — there is no `middleware.ts`) reads the user's `profiles.role` on every request and redirects based on audience. After login it routes internal roles to `/internal/control-room`, partners to the partner portal, everyone else to the customer portal. **When adding a new role or protected route, update both `proxy.ts` and the corresponding RLS policy** — they are independent and must stay in sync.

### Supabase clients — pick the right one

- `src/lib/supabase/server.ts` (`createClient`, async) — Server Components / server code, cookie-based session.
- `src/lib/supabase/client.ts` (`createClient`, sync) — Client Components (`'use client'`).

The codebase currently mutates data **directly from Client Components** via the browser Supabase client (see `src/app/(internal)/internal/ideas/new/page.tsx`, `src/app/(public)/request-build/page.tsx`) rather than Server Actions/route handlers. RLS is the security boundary, not the API layer. List/detail pages are typically async Server Components that query via the server client (see `control-room/page.tsx`). Exception: ZO_Agent actions use Server Actions (`src/lib/actions/ai-assist.ts`).

### Information architecture

The data model has two distinct layers:

**Studio layer** (core CRM/PM):
- `ideas` (legacy) → carries into `business_ideas` via migration 014
- `projects`, `tasks`, `leads`, `partners`, `customers`, `proposals`, `deals`

**Product layer** (migration 014+):
- `business_verticals` — brands/business lines (AIWithNoBrain, IgnAIte, EpicsToYou, ZeroOrigins Internal)
- `business_ideas` (Ideas Vault) — raw concepts, conceptually rooted at `D:\AI-Workspace\Ideas`
- `applications` (Application Registry) — built products/repos, conceptually rooted at `D:\AI-Workspace\Repos`
- `source_registry` — where files/repos/docs/deployments live for each application
- `ai_workspace_apps` (migration 003+) — synced from disk via `scripts/sync-ai-workspace.mjs`, separate from the Application Registry

These are separate concerns. `applications` is the curated registry of what's been built; `ai_workspace_apps` is a disk-scan snapshot. Do not conflate them.

### Data model & RLS

Migrations are in `supabase/migrations/` (001 through 014+). Key conventions:

- Status values are **Postgres enums or check constraints** mirrored as `as const` string-literal unions in `src/types/index.ts`. Changing a status requires editing **both** the migration and the TS type.
- Most domain tables follow `owner_id` / `created_by` (→ `profiles`) + `created_at` / `updated_at`, with a `set_updated_at` trigger.
- `handle_new_user()` trigger auto-creates a `profiles` row on `auth.users` signup: `@zeroorigins.in` email → `employee`, all others → `CUSTOMER`.
- RLS leans on `is_internal_user()` / `get_user_role()` SECURITY DEFINER helpers. Pattern: internal users get `for all`; public forms get narrow `for insert with check (true)` on `leads` and `partners`; customers/partners get scoped `select`.

`supabase/seed.sql` holds seed data. There is no generated Supabase types file — `src/types/index.ts` is hand-maintained.

**Migration discipline:** there is no CLI link to the remote project — migrations are applied by pasting files into the Supabase SQL editor, which drifts. Run `pnpm check:migrations` (sentinel-column probe against the remote DB) before debugging any "missing data" issue and after adding a migration. When you add a migration, also add its sentinel to `scripts/check-migrations.mjs`.

### ZO_Agent (live AI assistant)

ZO_Agent is a live AI agent powered by **Together AI** (`TOGETHER_API_KEY`). It is NOT a stub.

Architecture:
- `src/lib/ai/together-client.ts` — raw Together AI chat client, JSON parser. Handles reasoning models: reads `reasoning` field as fallback when `content` is empty. Uses `developer` role + `temperature: 1.0` + `reasoning_effort: "low"` for GPT-OSS models; `reasoning: { enabled: false }` for Hybrid models (Qwen3.5).
- `src/lib/ai/model-router.ts` — maps task types to models (cheap: Qwen3.5-9B, strong: gpt-oss-120b / DeepSeek-V4-Pro)
- `src/lib/ai/assist-intents.ts` — intent registry, mode mapping, system prompt builder, JSON schemas per intent
- `src/lib/actions/ai-assist.ts` — Server Actions: `createAiAssistDraft`, `confirmAiAssistDraft`, query runners, meeting/finance helpers

Flow: user text → `createAiAssistDraft` calls Together AI → returns structured `ZoAgentOutput` → if `mode === 'query'/'summary'` executes DB query immediately → saves to `ai_assist_requests` as `draft` or `confirmed` → user clicks confirm → `confirmAiAssistDraft` creates the actual record.

**Intents that create records** (require explicit user confirmation): `create_task`, `schedule_meeting`, `create_spending`, `create_followup`, `create_project`, `create_proposal`, `create_idea`, `promote_idea_to_application`, `create_application`, `update_application_source`.

**`create_spending`** inserts into `finance_transactions` with: type, amount, currency, description, category, status, date, notes (includes paid_by info). Triggered by phrases like "add spending 10000 INR on X paid by Y".

**`promote_idea_to_application`** is a special two-step: finds the matching `business_ideas` row by title (fuzzy `ilike`), creates an `applications` row, then marks the idea `promoted_to_application`. If the idea isn't found, it throws — do not bypass this.

The old `src/lib/ai/*.ts` stubs (`requirement-summarizer`, `followup-generator`, `proposal-generator`, `partner-evaluator`, `project-brief-generator`) still return `{ success: false }` — they are not wired to ZO_Agent.

### Form validation strategy

- **Public forms** (`/request-build`, `/partner-with-us`) — minimal inline pre-submit validation via `src/lib/validation.ts` (`isValidEmail`, `isValidPhoneLike`, `isValidUrl`, `minLength`). Errors shown inline per field; Supabase insert blocked until valid. Also have server-error fallback for failed inserts.
- **Internal forms** — intentionally lightweight in Phase 1: HTML `required` + Supabase error surfacing via `setError()`. These are used by known team members, not anonymous public traffic.
- **Rule:** A public form field must exist in the DB schema before it can be wired. Never add a form field without the corresponding migration + `src/types/index.ts` update — otherwise the insert silently drops the data.

### Internal access rules

- Internal workspace (`/internal/*`) requires BOTH:
  1. An official email ending with `@zeroorigins.in`.
  2. An internal role (`admin` or `employee`).
- New `@zeroorigins.in` signups automatically receive the `employee` role. First `admin` must be set directly in the database.
- Access is enforced at the network level via `src/proxy.ts` (edge middleware) and within form logic.
- `admin` can see all records and has access to Finance/Settings nav items; `employee` sees the same dashboard shell with scoped data access.

### Gateway behavior

- The root page `/` is a permanent gateway and never auto-redirects. It displays paths for Internal Workspace, Customer Portal, and Partner Portal.
- Authenticated users see an "Account Identity" card on the root page with a direct link to their dashboard.

### UI conventions

- Brand tokens: `zo-purple` (`#8b5cf6`, primary accent), `zo-purple-2`, `zo-chrome` (headings), `zo-silver`. Use these for brand styling (e.g. `text-zo-chrome`, `text-zo-purple`) alongside standard semantic tokens (`bg-card`, `border-border`, `text-muted-foreground`).
- Tailwind v4 (CSS-first config in `src/app/globals.css`).
- Selection styling: `::selection` uses `zo-purple/30` for a branded, non-browser-default look.
- Forms support `intent` query parameters (`internal`, `customer`, `partner`) for tailored messaging.

### Environment

Requires:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `TOGETHER_API_KEY` — ZO_Agent (Together AI). Without this the ZO_Agent panel will throw on every request.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` — Google Calendar OAuth. Without these, calendar sync/push won't work.
- `RESEND_API_KEY` — email notifications via Resend. Without this, emails silently skip (no crash).
- `OPENAI_API_KEY` — voice transcription endpoint (`/api/voice/transcribe`). Only needed when implementing the voice feature.
- `SUPABASE_SERVICE_ROLE_KEY` — workspace sync script only (`pnpm sync:workspace`), never used in the Next.js app.

---

## Current Implementation Status

| Entity | List | Detail | Create | Edit | Status change | Active filter |
|--------|------|--------|--------|------|---------------|---------------|
| Ideas (legacy) | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ |
| Business Ideas (Ideas Vault) | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ |
| Applications (App Registry) | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ |
| Projects | ✅ | ✅ (+ tasks) | ✅ | ✅ | ✅ (via edit) | ✅ |
| Tasks | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ |
| Leads | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ |
| Partners | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ |
| Customers | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ |
| AI Workspace | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ (group/status filters) |
| Proposals | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ |
| Meetings | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ (Team/My/All Teams) |

Stub pages behind `ComingSoon` component: Assets, Content Studio, Finance (admin), Knowledge, Settings (admin). The `deals` table (migration 005) and `source_registry` table (migration 014) have **no UI yet**.

- Hard delete: intentionally absent — see **Record lifecycle** below.
- Control room: counts + active/open/new summaries. No edit actions from here.
- Portal pages (`/portal/customer/dashboard`, `/portal/partner/dashboard`): stubs — exist but show nothing useful.
- Public intake forms (`/request-build`, `/partner-with-us`): functional.
- Voice agent (`VoiceAgentButton`, `/api/voice/transcribe`): contract test exists at `scripts/test-voice-agent-contract.mjs` — run it to verify the implementation.

### Record lifecycle — no hard delete

Phase 1 uses **status-based lifecycle management** instead of hard delete. Records are never physically removed.

**How closure works per entity:**

| Entity | Use these statuses to close |
|--------|-----------------------------|
| Business Ideas | `rejected`, `archived` |
| Applications | `archived` |
| Projects | `archived`, `cancelled` |
| Tasks | `cancelled`, `done` |
| Leads | `lost`, `archived` |
| Partners | `rejected`, `archived` |

List pages default to the **Active** view (excludes closed statuses) with an **All** toggle at `?view=all`.

### Resource Kit

Shared primitives for internal list pages live in `src/lib/resource-kit/` and `src/components/resource-kit/`. They handle: page headers, Active/All filter tabs, empty states, and status badges. All entity list pages use them. See `docs/RESOURCE_KIT.md` for usage.

**When adding a new entity:** use the Resource Kit components. Do not copy-paste from an existing list page.
**What is NOT in the Resource Kit:** detail page layout, form components, Supabase query logic — those stay entity-specific.

### Automation fields on leads and partners

Migration `002_contact_and_automation_fields.sql` adds contact fields (`phone`, `whatsapp`, `website`, `linkedin`) and automation metadata (`automation_status`, `automation_source`, `n8n_workflow_id`, `external_reference_id`, `ai_summary`, `ai_score`) to both tables.

Public forms set `automation_status = 'not_started'` and `automation_source = 'zeroorigins_os_public_form'` on every insert. This is the hook for future n8n workflows — filter `leads` or `partners` where `automation_status = 'not_started'` to find unprocessed submissions.

### Calendar & Google Sync

Meetings (`/internal/meetings`) have full bi-directional Google Calendar sync:

- **Create → Google push:** `createMeeting()` auto-pushes to Google Calendar if the user has connected via OAuth (`google_tokens` table). No manual source selection needed.
- **Sync Now → Google pull:** `/api/calendar/sync` fetches the user's primary Google Calendar events (next 30 days) and upserts into `meetings` by `calendar_event_id`.
- **OAuth flow:** `/api/auth/google` → Google consent → `/api/auth/google/callback` stores tokens.
- **Delete:** `deleteMeeting()` server action removes from local DB (does not delete from Google Calendar).
- **Admin deduplication:** "All Teams" view deduplicates by `calendar_event_id` so the same Google event synced by multiple people only shows once.

**Required env vars:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

### Email notifications

Email is handled via **Resend** (`resend` package). Utility at `src/lib/email/notifications.ts`.

- `sendMeetingNotification()` — sends to all attendees on meeting creation (fire-and-forget).
- Does not block the main action if email fails.
- **Required env var:** `RESEND_API_KEY`. Optional: `RESEND_FROM_EMAIL` (default: `noreply@zeroorigins.in`).

When adding new email notifications: follow the same fire-and-forget pattern (`.catch(() => {})`) so email failures never break business logic.

### AI Workspace sync — rules

The AI Workspace page (`/internal/ai-workspace`) reads from the `ai_workspace_apps` table. Rows get there via `scripts/sync-ai-workspace.mjs`, which scans `D:\AI-Workspace` locally and upserts to Supabase. The browser never scans disk.

**Rules that must hold:**
1. Upsert key is `slug` (unique index `ai_workspace_apps_slug_key`, migration 009). Never change the conflict target without a matching migration.
2. The sync only upserts — it never deletes rows. Folders removed from disk keep their DB row.
3. Dry-run must always work without any Supabase env. Write mode must fail loudly (exit 1, name the missing var) if `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_URL` is missing from `.env.local`.
4. `BRAND_FOLDERS` and `FOLDER_GROUPS` in the script must match the real top-level folder names in `D:\AI-Workspace` exactly (case/spelling — past bug: `Alwithnobrain` vs `AIwithnobrain`). When a new top-level folder is added on disk, add it to the script AND to `AI_FOLDER_GROUPS` in `src/types/index.ts` if it should appear as a UI filter.
5. Dot-folders (`.claude`, `.git`, …) and `IGNORE_PATTERNS` entries are skipped — keep it that way.
6. New columns written by the sync require a migration on the remote DB **before** syncing — Supabase silently has no column otherwise. Verify remote schema is current when debugging "missing data".

**Automation:** Windows Task Scheduler task "AI Workspace Sync" runs the script daily at 9:00 AM on Naveen's machine; log at `D:\AI-Workspace\Temp\sync-ai-workspace.log`. Manual `pnpm sync:workspace` for immediate updates.

**Known data nuance:** 9 seed rows from migration 003 have `slug = NULL` and overlap by name with synced rows (e.g. OrgTrace, QureWell). Do not delete them without explicit approval.

### Intelligence Radar — Zero Audience Voice

**Purpose:** Internal market signal hub. Capture URLs → AI classifies category/scores/angles → generate LinkedIn/Instagram/X/Carousel drafts → human reviews before publishing. Phase 1 is manual capture only; no auto-publishing; no LinkedIn/X scraping.

**Tables (migration 020):** `radar_sources`, `radar_items`, `radar_content_ideas`, `radar_actions`  
**Apply:** paste `supabase/migrations/020_radar_intelligence.sql` into Supabase SQL editor. Run `pnpm check:migrations` after.

**Routes:**
- `/internal/radar` — signal dashboard
- `/internal/radar/[id]` — signal detail + AI actions
- `/internal/radar/sources` + `/sources/new` — source registry (admin-write)
- `/internal/radar/events` — events view
- `/internal/radar/content-ideas` — draft review queue

**Key lib files:** `src/lib/radar/` (scoring.ts, prompts.ts, ai.ts, queries.ts, actions.ts)  
**Key components:** `src/components/radar/` (RadarItemCard, AddSignalDialog, RadarItemActions, ContentIdeaCard, RadarScoreBadge)  
**Navigation:** Added to `primary` group in `src/lib/internal-navigation.ts`

**Rules:**
- Do NOT auto-publish to LinkedIn, Instagram, or X
- Do NOT scrape LinkedIn or X directly
- Placeholder AI output is labelled `[AI draft generation unavailable]` — never present it as real AI output
- `radar_sources` write requires `admin` role — enforced in both `requireAdmin()` and RLS
- AI calls use Together AI (`TOGETHER_API_KEY`) via existing `callTogetherChat` — if key is missing, classification returns placeholder

**Docs:** `docs/features/zero-audience-voice-radar/` (README, ARCHITECTURE, DATABASE, AI_PROMPTS, OPEN_ITEMS, CHANGELOG, PHASE_PLAN)
