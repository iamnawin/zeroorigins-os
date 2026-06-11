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

The codebase currently mutates data **directly from Client Components** via the browser Supabase client (see `src/app/(internal)/internal/ideas/new/page.tsx`, `src/app/(public)/request-build/page.tsx`) rather than Server Actions/route handlers. RLS is the security boundary, not the API layer. List/detail pages are typically async Server Components that query via the server client (see `control-room/page.tsx`).

### Data model & RLS

Single migration `supabase/migrations/001_initial_schema.sql` is the source of truth. Key conventions:

- Status values are **Postgres enums** mirrored as `as const` string-literal unions in `src/types/index.ts`. Changing a status requires editing **both** the enum (a new migration) and the TS type.
- Most domain tables follow `owner_id` / `created_by` (→ `profiles`) + `created_at` / `updated_at`, with a `set_updated_at` trigger.
- `handle_new_user()` trigger auto-creates a `profiles` row on `auth.users` signup: `@zeroorigins.in` email → `employee`, all others → `CUSTOMER`.
- RLS leans on `is_internal_user()` / `get_user_role()` SECURITY DEFINER helpers. Pattern: internal users get `for all`; public forms get narrow `for insert with check (true)` on `leads` and `partners`; customers/partners get scoped `select`.

`supabase/seed.sql` holds seed data. There is no generated Supabase types file — `src/types/index.ts` is hand-maintained.

**Migration discipline:** there is no CLI link to the remote project — migrations are applied by pasting files into the Supabase SQL editor, which drifts. Run `pnpm check:migrations` (sentinel-column probe against the remote DB) before debugging any "missing data" issue and after adding a migration. When you add a migration, also add its sentinel to `scripts/check-migrations.mjs`.

### Form validation strategy

- **Public forms** (`/request-build`, `/partner-with-us`) — minimal inline pre-submit validation via `src/lib/validation.ts` (`isValidEmail`, `isValidPhoneLike`, `isValidUrl`, `minLength`). Errors shown inline per field; Supabase insert blocked until valid. Also have server-error fallback for failed inserts.
- **Internal forms** — intentionally lightweight in Phase 1: HTML `required` + Supabase error surfacing via `setError()`. These are used by known team members, not anonymous public traffic.
- **Future:** Add Zod schema validation when portal workflows (customer/partner dashboards) mature and external user input increases.
- **Rule:** A public form field must exist in the DB schema before it can be wired. Never add a form field without the corresponding migration + `src/types/index.ts` update — otherwise the insert silently drops the data.

### AI features are stubs

`src/lib/ai/*.ts` (requirement summarizer, follow-up/proposal/brief generators, partner evaluator) are **placeholders** that return `{ success: false, message: 'AI generation is not configured yet...' }`. Implement these when wiring an LLM provider; don't assume they work.

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

Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## Current Implementation Status

| Entity | List | Detail | Create | Edit | Status change | Active filter |
|--------|------|--------|--------|------|---------------|---------------|
| Ideas | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ |
| Projects | ✅ | ✅ (+ tasks) | ✅ | ✅ | ✅ (via edit) | ✅ |
| Tasks | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ |
| Leads | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ |
| Partners | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ |
| Customers | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ |
| AI Workspace | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ (group/status filters) |
| Proposals | ✅ | ✅ | ✅ | ✅ | ✅ (via edit) | ✅ |

Stub pages behind `ComingSoon` component: Assets, Content Studio, Finance (admin), Knowledge, Settings (admin). The `deals` table (migration 005) has **no UI or code references yet**.

- Hard delete: intentionally absent — see **Record lifecycle** below.
- Control room: counts + active/open/new summaries. No edit actions from here.
- Portal pages (`/portal/customer/dashboard`, `/portal/partner/dashboard`): stubs — exist but show nothing useful.
- Public intake forms (`/request-build`, `/partner-with-us`): functional.
- All AI helpers (`src/lib/ai/*.ts`): stubs returning `{ success: false }`.

### Record lifecycle — no hard delete

Phase 1 uses **status-based lifecycle management** instead of hard delete. Records are never physically removed.

**Why:** Ideas, leads, partners, projects, and tasks are business history. Deleting a lead breaks the story of how a customer was acquired. Deleting a task breaks the story of what was built. Hard delete also risks broken foreign key references across tables.

**How closure works per entity:**

| Entity | Use these statuses to close |
|--------|-----------------------------|
| Ideas | `archived`, `rejected` |
| Projects | `archived`, `cancelled` |
| Tasks | `cancelled`, `done` |
| Leads | `lost`, `archived` |
| Partners | `rejected`, `archived` |

List pages default to the **Active** view (excludes closed statuses) with an **All** toggle at `?view=all`.

**Future (Phase 2+):** Hard delete may be added exclusively for `admin` role, with a two-step confirmation dialog and an audit log entry before execution. Do not implement without those guardrails.

### Resource Kit

Shared primitives for internal list pages live in `src/lib/resource-kit/` and `src/components/resource-kit/`. They handle: page headers, Active/All filter tabs, empty states, and status badges. All 5 entity list pages use them. See `docs/RESOURCE_KIT.md` for usage.

**When adding a new entity:** use the Resource Kit components. Do not copy-paste from an existing list page.
**What is NOT in the Resource Kit:** detail page layout, form components, Supabase query logic — those stay entity-specific.

### Automation fields on leads and partners

Migration `002_contact_and_automation_fields.sql` adds contact fields (`phone`, `whatsapp`, `website`, `linkedin`) and automation metadata (`automation_status`, `automation_source`, `n8n_workflow_id`, `external_reference_id`, `ai_summary`, `ai_score`) to both tables.

Public forms set `automation_status = 'not_started'` and `automation_source = 'zeroorigins_os_public_form'` on every insert. This is the hook for future n8n workflows — filter `leads` or `partners` where `automation_status = 'not_started'` to find unprocessed submissions.

### AI Workspace sync — rules

The AI Workspace page (`/internal/ai-workspace`) reads from the `ai_workspace_apps` table. Rows get there via `scripts/sync-ai-workspace.mjs`, which scans `D:\AI-Workspace` locally and upserts to Supabase. The browser never scans disk.

**Commands:**
- `pnpm sync:workspace --dry-run` — preview detected records, no writes
- `pnpm sync:workspace` — upsert to database
- Tests: `node --test scripts/sync-ai-workspace.test.mjs`

**Rules that must hold:**
1. Upsert key is `slug` (unique index `ai_workspace_apps_slug_key`, migration 009). Never change the conflict target without a matching migration.
2. The sync only upserts — it never deletes rows. Folders removed from disk keep their DB row.
3. Dry-run must always work without any Supabase env. Write mode must fail loudly (exit 1, name the missing var) if `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_URL` is missing from `.env.local`.
4. `BRAND_FOLDERS` and `FOLDER_GROUPS` in the script must match the real top-level folder names in `D:\AI-Workspace` exactly (case/spelling — past bug: `Alwithnobrain` vs `AIwithnobrain`). When a new top-level folder is added on disk, add it to the script AND to `AI_FOLDER_GROUPS` in `src/types/index.ts` if it should appear as a UI filter.
5. Dot-folders (`.claude`, `.git`, …) and `IGNORE_PATTERNS` entries are skipped — keep it that way.
6. New columns written by the sync require a migration on the remote DB **before** syncing — Supabase silently has no column otherwise. Verify remote schema is current when debugging "missing data" (the remote DB has previously lagged behind `supabase/migrations/`).

**Automation:** Windows Task Scheduler task "AI Workspace Sync" runs the script daily at 9:00 AM on Naveen's machine; log at `D:\AI-Workspace\Temp\sync-ai-workspace.log`. Manual `pnpm sync:workspace` for immediate updates.

**Known data nuance:** 9 seed rows from migration 003 have `slug = NULL` and overlap by name with synced rows (e.g. OrgTrace, QureWell). Do not delete them without explicit approval.

### Remaining gaps

- Detail pages do not yet show the new contact/automation fields for leads and partners — add them in a Phase 2 edit.
- Portal pages (`/portal/customer/dashboard`, `/portal/partner/dashboard`) are stubs.
- All AI helpers (`src/lib/ai/*.ts`): stubs returning `{ success: false }`.
