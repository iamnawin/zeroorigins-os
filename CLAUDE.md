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

- `(internal)` → `/internal/*` — the team. Roles: `SUPER_ADMIN`, `FOUNDER`, `DIRECTOR`, `STAFF`, `CONTRACTOR` (`INTERNAL_ROLES` in `src/types/index.ts`).
- `(portal)` → `/portal/customer/*` and `/portal/partner/*` — external `CUSTOMER`, `PARTNER`, `REFERRAL_PARTNER`.
- `(public)` → `/request-build`, `/partner-with-us` — unauthenticated lead/partner intake forms.
- `(auth)` → `/login`, `/signup`, `/forgot-password`.

`src/middleware.ts` reads the user's `profiles.role` on every request and redirects based on audience. After login it routes internal roles to `/internal/control-room`, partners to the partner portal, everyone else to the customer portal. **When adding a new role or protected route, update both `middleware.ts` and the corresponding RLS policy** — they are independent and must stay in sync.

### Supabase clients — pick the right one

- `src/lib/supabase/server.ts` (`createClient`, async) — Server Components / server code, cookie-based session.
- `src/lib/supabase/client.ts` (`createClient`, sync) — Client Components (`'use client'`).

The codebase currently mutates data **directly from Client Components** via the browser Supabase client (see `src/app/(internal)/internal/ideas/new/page.tsx`, `src/app/(public)/request-build/page.tsx`) rather than Server Actions/route handlers. RLS is the security boundary, not the API layer. List/detail pages are typically async Server Components that query via the server client (see `control-room/page.tsx`).

### Data model & RLS

Single migration `supabase/migrations/001_initial_schema.sql` is the source of truth. Key conventions:

- Status values are **Postgres enums** mirrored as `as const` string-literal unions in `src/types/index.ts`. Changing a status requires editing **both** the enum (a new migration) and the TS type.
- Most domain tables follow `owner_id` / `created_by` (→ `profiles`) + `created_at` / `updated_at`, with a `set_updated_at` trigger.
- `handle_new_user()` trigger auto-creates a `profiles` row (default role `CUSTOMER`) on `auth.users` signup.
- RLS leans on `is_internal_user()` / `get_user_role()` SECURITY DEFINER helpers. Pattern: internal users get `for all`; public forms get narrow `for insert with check (true)` on `leads` and `partners`; customers/partners get scoped `select`.

`supabase/seed.sql` holds seed data. There is no generated Supabase types file — `src/types/index.ts` is hand-maintained.

### Form validation strategy

- **Public forms** (`/request-build`, `/partner-with-us`) — minimal inline pre-submit validation via `src/lib/validation.ts` (`isValidEmail`, `isValidPhoneLike`, `isValidUrl`, `minLength`). Errors shown inline per field; Supabase insert blocked until valid. Also have server-error fallback for failed inserts.
- **Internal forms** — intentionally lightweight in Phase 1: HTML `required` + Supabase error surfacing via `setError()`. These are used by known team members, not anonymous public traffic.
- **Future:** Add Zod schema validation when portal workflows (customer/partner dashboards) mature and external user input increases.
- **Rule:** A public form field must exist in the DB schema before it can be wired. Never add a form field without the corresponding migration + `src/types/index.ts` update — otherwise the insert silently drops the data.

### AI features are stubs

`src/lib/ai/*.ts` (requirement summarizer, follow-up/proposal/brief generators, partner evaluator) are **placeholders** that return `{ success: false, message: 'AI generation is not configured yet...' }`. Implement these when wiring an LLM provider; don't assume they work.

### UI conventions

- shadcn/ui-style primitives in `src/components/ui/`, built on `@base-ui/react` (not Radix) and `class-variance-authority`. Use the `cn()` helper from `src/lib/utils.ts`.
- Tailwind v4 (CSS-first config in `src/app/globals.css`, no `tailwind.config.js`). Dark theme is the default `:root`.
- Brand tokens: `zo-purple` (`#8b5cf6`, primary accent), `zo-purple-2`, `zo-chrome` (headings), `zo-silver`. Use these for brand styling (e.g. `text-zo-chrome`, `text-zo-purple`) alongside standard semantic tokens (`bg-card`, `border-border`, `text-muted-foreground`).
- Path alias `@/*` → `src/*`.

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

**Future (Phase 2+):** Hard delete may be added exclusively for `SUPER_ADMIN` role, with a two-step confirmation dialog and an audit log entry before execution. Do not implement without those guardrails.

### Resource Kit

Shared primitives for internal list pages live in `src/lib/resource-kit/` and `src/components/resource-kit/`. They handle: page headers, Active/All filter tabs, empty states, and status badges. All 5 entity list pages use them. See `docs/RESOURCE_KIT.md` for usage.

**When adding a new entity:** use the Resource Kit components. Do not copy-paste from an existing list page.
**What is NOT in the Resource Kit:** detail page layout, form components, Supabase query logic — those stay entity-specific.

### Automation fields on leads and partners

Migration `002_contact_and_automation_fields.sql` adds contact fields (`phone`, `whatsapp`, `website`, `linkedin`) and automation metadata (`automation_status`, `automation_source`, `n8n_workflow_id`, `external_reference_id`, `ai_summary`, `ai_score`) to both tables.

Public forms set `automation_status = 'not_started'` and `automation_source = 'zeroorigins_os_public_form'` on every insert. This is the hook for future n8n workflows — filter `leads` or `partners` where `automation_status = 'not_started'` to find unprocessed submissions.

### Remaining gaps

- Detail pages do not yet show the new contact/automation fields for leads and partners — add them in a Phase 2 edit.
- Portal pages (`/portal/customer/dashboard`, `/portal/partner/dashboard`) are stubs.
- All AI helpers (`src/lib/ai/*.ts`): stubs returning `{ success: false }`.
