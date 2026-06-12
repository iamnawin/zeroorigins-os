# ZeroOrigins OS — Context Handoff

> **Read this first if you are an AI model or developer picking up this repo.**
> This is the living single-source-of-truth for *where we are, how we got here, and what's next*.
> Pair it with `CLAUDE.md` (architecture + conventions), `AGENTS.md` (Next.js 16 warning), and `docs/ROADMAP.md` (forward plan).
> **Keep this file updated at the end of every working session.**

**Last updated:** 2026-06-13

---

## 0. Current Active Work: CRM Source Of Truth

Active branch: `main`

The user approved a phased redesign of ZeroOrigins OS into a practical internal CRM/source-of-truth for a three-person internal team. The design is documented at:

- `docs/superpowers/specs/2026-06-13-zeroorigins-crm-source-of-truth-design.md`
- `docs/superpowers/plans/2026-06-13-crm-foundation-phase-1.md`
- `docs/superpowers/plans/2026-06-13-crm-internal-navigation-phase-2.md`
- `docs/superpowers/plans/2026-06-13-crm-knowledge-source-phase-3.md`

Execution rule from user: complete phases individually, push each phase, and after the first three phases are complete, merge them into `main`.

Merge status: **Phases 1, 2, and 3 have been fast-forward merged into `main`.**

Current phase: **Ready for Phase 4: Team And Calendar Foundations**

Phase 1 scope:
- Extend migration/schema checks beyond migration `009`.
- Add a CRM health check for `.env.local`, Supabase schema, and active internal profiles.
- Keep documentation current so another model can resume without chat context.

Phase 1 finding:
- `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- `npm run check:migrations` now reports the remote schema is in sync with `supabase/migrations/`.
- `npm run check:crm` now passes all 17 schema sentinels.
- `npm run check:crm` found two active admin profiles: `hello@zeroorigins.in` and `naveent@zeroorigins.in`.
- The user applied these SQL files manually in Supabase from the `zerooriginsai@gmail.com` Supabase account:
  - `supabase/migrations/010_meetings_crm.sql`
  - `supabase/migrations/011_company_spending.sql`

Latest Phase 1 verification, 2026-06-13:

```powershell
npm run check:migrations # pass
npm run check:crm        # pass
```

Phase 2 shipped:
- Shared internal navigation contract in `src/lib/internal-navigation.ts`.
- Navigation contract test in `scripts/test-internal-navigation.mjs`.
- Top navigation now prioritizes Control, Projects, Tasks, Meetings, Knowledge, Finance, AI Workspace, Leads, Deals, and Proposals.
- Customers and Partners remain reachable but are visually deferred.
- Control Room now surfaces Finance, Knowledge, AI Workspace, and Calendar as source-of-truth shortcuts.
- Customer and Partner empty states now explain when to use those records instead of implying missing dummy data.

Phase 3 shipped:
- `knowledge_articles` is now covered by migration/CRM health sentinels.
- Knowledge server actions exist: `createKnowledgeArticle` and `updateKnowledgeArticle`.
- Knowledge routes now exist:
  - `/internal/knowledge`
  - `/internal/knowledge/new`
  - `/internal/knowledge/[id]`
  - `/internal/knowledge/[id]/edit`
- Knowledge supports title, content, category, tags, owner, created_by, and timestamps.
- Control Room now shows a live Knowledge document count.

Next phases:
- Phase 4: team and calendar foundations.

Resume commands:

```powershell
git status --short --branch
npm run test:crm-foundation
npm run test:crm-navigation
npm run test:crm-knowledge
npm run check:migrations
npm run check:crm
npm run lint
npm run build
```

---

## 1. What this product is

ZeroOrigins OS is the internal operating system / CRM for an AI services studio. Three audiences, enforced at **two layers** (middleware routing + Postgres RLS):

- **Internal** (`/internal/*`) — the team. Roles: `SUPER_ADMIN`, `FOUNDER`, `DIRECTOR`, `STAFF`, `CONTRACTOR`. Requires `@zeroorigins.in` email **and** an approved internal role.
- **Portal** (`/portal/customer/*`, `/portal/partner/*`) — external `CUSTOMER`, `PARTNER`, `REFERRAL_PARTNER` (stubs today).
- **Public** (`/request-build`, `/partner-with-us`) — unauthenticated intake forms.

Stack: **Next.js 16 (App Router) + React 19 + Supabase (Postgres, Auth, RLS) + Tailwind v4**. Package manager: **pnpm**. No test runner configured.

---

## 2. Build history (newest first)

| Date | What shipped |
|------|--------------|
| 2026-06-08 | **Internal Control Room rebuilt** = first real operating dashboard: identity header (name/role/email/workspace + sign out), 8 live-count module cards, 6 quick actions, AI Workspace snapshot, 4 recent-activity sections. Role-aware sidebar (Finance/Settings → FOUNDER/SUPER_ADMIN), **zero dead links** (unbuilt modules → "Coming Soon" placeholder pages). |
| 2026-06-08 | **AI Workspace module** (manual-first): full CRUD, `ai_workspace_apps` table migrated + seeded with 9 apps. GitHub/Vercel sync **deferred by design**. See `docs/AI_WORKSPACE.md`. |
| 2026-06-08 | Profile self-healing (`ensureProfile`) to fix "User profile not found". |
| 2026-06-08 | Auth callback route + email-confirmation signup flow. |
| 2026-06-08 | Internal email-domain enforcement (`@zeroorigins.in`) + root gateway redesign (permanent 3-path gateway, no auto-redirect). |
| 2026-06-07 | Visual identity overhaul → premium AI studio (Black / Violet / Grey). |
| 2026-06-07 | Resource Kit base layer + contact/automation fields on leads & partners (migration 002). See `docs/RESOURCE_KIT.md`. |
| 2026-06-07 | Status-based lifecycle (no hard delete); Active/All filters across 5 entity lists; full CRUD for Ideas/Projects/Tasks/Leads/Partners. |

---

## 3. Current state — what is built

| Entity | List | Detail | Create | Edit | Notes |
|--------|------|--------|--------|------|-------|
| Ideas | ✅ | ✅ | ✅ | ✅ | Resource Kit |
| Projects | ✅ | ✅ (+tasks) | ✅ | ✅ | Resource Kit |
| Tasks | ✅ | ✅ | ✅ | ✅ | Resource Kit |
| Leads | ✅ | ✅ | ✅ | ✅ | + contact/automation fields |
| Partners | ✅ | ✅ | ✅ | ✅ | + contact/automation fields |
| AI Workspace | ✅ | ✅ | ✅ | ✅ | manual-first, seeded |
| Control Room | ✅ | — | — | — | real dashboard |
| **Deals** | ❌ | ❌ | ❌ | ❌ | new entity — table not yet created |
| **Proposals** | 🟡 placeholder | ❌ | ❌ | ❌ | table exists (FKs ready) |
| **Customers** | 🟡 placeholder | ❌ | ❌ | ❌ | table exists (FKs ready) |
| Assets / Content Studio / Finance / Knowledge / Settings | 🟡 placeholder | — | — | — | "Coming Soon" pages |

Placeholder pages use `src/components/internal/coming-soon.tsx`.

---

## 4. Data model — pipeline backbone (already in schema)

The Lead → Proposal → Customer → Project chain is **mostly wired in `001_initial_schema.sql`**:

- `customers.lead_id` → `leads(id)` — lead becomes customer.
- `proposals.lead_id` / `proposals.customer_id` / `proposals.project_id` — proposal links to all three.
- `proposals` extended (003): `service_type, scope, timeline, proposal_url, internal_notes, sent_at, expires_at`.
- `customers` extended (003): `phone, website`.

**Known gaps (need a migration):**
- `projects` has **no `customer_id`** — a project can only reach a customer indirectly via a proposal. Add a direct link.
- There is **no `deals` table** — the Deal/Opportunity stage is new. Add `deals` + a `deal_stage` enum, and add `proposals.deal_id` so proposals attach to a deal.

Relevant status enums:
- `lead_status`: new → contacted → discovery_scheduled → discovery_done → proposal_needed → proposal_sent → negotiation → **won** / lost / on_hold / archived
- `proposal_status`: draft → internal_review → sent → viewed → **accepted** / rejected / revision_requested / expired
- `customers.status`: active / inactive / churned

---

## 5. In progress — Lead → Deal → Proposal → Customer → Project flow

**Canonical chain (LOCKED 2026-06-08):**
`Lead Captured → Qualified Lead → Create Deal → Create Proposal → Proposal Accepted → Convert to Customer → Create Project`

**Scope decision (LOCKED 2026-06-08):** *Full modules + conversion.* Build **Deals**, **Proposals**, and **Customers** as complete Resource Kit modules (list/detail/new/edit), replacing the placeholders, **and** wire the convert actions across the whole chain.

**Conversion is manual + guided (LOCKED):** no silent cascades. Each step is an explicit button that pre-fills from the parent record; the user reviews and saves. The system *assists* with smart prompts/validation:
- "This lead is qualified. Create Deal?"
- "Proposal accepted. Convert this account to customer?"
- "Missing billing details before customer conversion."
- "Customer already exists. Link instead of creating duplicate." (dedupe by email)

**Deals — lightweight MVP fields:** `name`, `lead_id`, `stage`, `estimated_value`, `expected_close_date`, `owner_id`, `next_step`, `notes`, linked proposal (`proposals.deal_id`).

### Open decisions (still being grilled — fill in as resolved)
| # | Decision | Status | Recommendation |
|---|----------|--------|----------------|
| 1 | Scope | ✅ Full modules + conversion | — |
| 2 | Conversion mechanism | ✅ **Manual buttons + smart validation/hints** (no silent cascades; warn on missing data; dedupe by email; suggest next action) | — |
| 2b | Deal/Opportunity entity | ✅ **Add a lightweight `deals` table** between qualified lead and proposal | — |
| 3 | Schema: add `projects.customer_id` (+ `lead_id`?) | ⏳ open | Yes — add `projects.customer_id`; skip `lead_id` on projects |
| 4 | Proposal entry point | ⏳ open | "Create Proposal" from **deal** detail (prefilled) **and** standalone `/new` |
| 5 | Customer creation source + dedupe | ⏳ open | From lead/deal (carry `lead_id`); dedupe by email |
| 6 | Status automation on convert | ⏳ open | All conversions manual; convert→Customer sets lead `won`; proposal `accepted` manual |
| 7 | Portal exposure of proposals/customers | ⏳ open | Defer — internal-only now (portals are stubs) |
| 8 | AI proposal generation | ⏳ open | Keep `src/lib/ai/*` stub; manual content for now |

---

## 6. Claude's proposed plan (for "Full modules + conversion")

Sequenced so each phase builds + lints green before the next:

- **Phase A — Schema:** ✅ DONE — migration `005_deals_and_pipeline_links.sql` →
  - new enum `deal_stage` + `deals` table (fields in §5)
  - `proposals.deal_id uuid references deals(id)`
  - `projects.customer_id uuid references customers(id)`
  - indexes on the new FKs
  - Update `src/types/index.ts` (`Deal`, `DEAL_STAGES`, `Project.customer_id`, `Proposal.deal_id`).
- **Phase B — Deals module:** `DealForm` + routes `/internal/deals`, `/new`, `/[id]`, `/[id]/edit` (Resource Kit). Add sidebar item.
- **Phase C — Proposals module:** `ProposalForm` + routes `/internal/proposals`, `/new`, `/[id]`, `/[id]/edit` (Resource Kit). Replace placeholder.
- **Phase D — Customers module:** `CustomerForm` + same route set (Resource Kit). Replace placeholder.
- **Phase E — Conversion actions (manual + guided):**
  - Lead detail → **Qualify Lead** (status) + **Create Deal** (prefill from lead; prompt shown when qualified).
  - Deal detail → **Create Proposal** (prefill `deal_id`/`lead_id`).
  - Proposal detail → **Mark Accepted** (+ hint to convert).
  - Lead/Deal → **Convert to Customer** (creates customer w/ `lead_id`, sets lead `won`; dedupe by email → offer link instead).
  - Customer detail → **Create Project** (sets `projects.customer_id`).
- **Phase F — Control Room:** Deals/Proposals/Customers cards link to real modules; add pipeline counts.

Out of scope (per standing rules): GitHub sync, n8n, AI automation, payments/commission, hard delete, full customer/partner portals.

---

## 7. What's left (backlog beyond the current flow)

- Lead/partner detail pages don't yet show the new contact/automation fields (Phase 2 edit).
- Customer & Partner portals are stubs.
- AI helpers (`src/lib/ai/*.ts`) all return `{ success: false }`.
- Pre-existing lint debt: `src/app/(auth)/login/page.tsx` (2× `no-explicit-any`), `src/app/page.tsx` + `src/proxy.ts` (unused-var warnings).
- n8n automation hook: filter `leads`/`partners` where `automation_status = 'not_started'`.

---

## 8. How to verify

```powershell
pnpm lint
pnpm build
```

There is **no** `pnpm test`. Migrations in `supabase/migrations/` must be applied manually to the remote Supabase project.
