# ZeroOrigins OS — Context Handoff

> **Read this first if you are an AI model or developer picking up this repo.**
> This is the living single-source-of-truth for *where we are, how we got here, and what's next*.
> Pair it with `CLAUDE.md` (architecture + conventions), `AGENTS.md` (Next.js 16 warning), and `docs/ROADMAP.md` (forward plan).
> **Keep this file updated at the end of every working session.**

**Last updated:** 2026-06-08

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

**Known gap:** `projects` has **no `customer_id`** — a project can only reach a customer indirectly via a proposal. A migration is needed to link projects → customers directly.

Relevant status enums:
- `lead_status`: new → contacted → discovery_scheduled → discovery_done → proposal_needed → proposal_sent → negotiation → **won** / lost / on_hold / archived
- `proposal_status`: draft → internal_review → sent → viewed → **accepted** / rejected / revision_requested / expired
- `customers.status`: active / inactive / churned

---

## 5. In progress — Lead → Proposal → Customer → Project flow

**Scope decision (LOCKED 2026-06-08):** *Full modules + conversion.* Build Proposals and Customers as complete Resource Kit modules (list/detail/new/edit), replacing the placeholders, **and** wire the convert actions across the whole chain.

### Open decisions (still being grilled — fill in as resolved)
| # | Decision | Status | Recommendation |
|---|----------|--------|----------------|
| 1 | Scope | ✅ Full modules + conversion | — |
| 2 | Conversion mechanism: manual buttons vs auto-cascade | ⏳ open | Manual "Convert" buttons with smart next-action hints (no silent cascades) |
| 3 | Schema: add `projects.customer_id` (+ `lead_id`?) | ⏳ open | Yes — add `projects.customer_id`; skip `lead_id` on projects |
| 4 | Proposal entry point | ⏳ open | "Create Proposal" from lead detail (prefilled) **and** standalone `/new` |
| 5 | Customer creation source + dedupe | ⏳ open | From lead (carry `lead_id`); dedupe by email |
| 6 | Status automation on convert | ⏳ open | Convert→Customer sets lead `won`; proposal `accepted` stays manual |
| 7 | Portal exposure of proposals/customers | ⏳ open | Defer — internal-only now (portals are stubs) |
| 8 | AI proposal generation | ⏳ open | Keep `src/lib/ai/*` stub; manual content for now |

---

## 6. Claude's proposed plan (for "Full modules + conversion")

Sequenced so each phase builds + lints green before the next:

- **Phase A — Schema:** migration `004_pipeline_links.sql` → add `projects.customer_id uuid references customers(id)` (+ index). Update `src/types/index.ts` `Project`.
- **Phase B — Proposals module:** `ProposalForm` + routes `/internal/proposals`, `/new`, `/[id]`, `/[id]/edit` using Resource Kit. Replace placeholder.
- **Phase C — Customers module:** `CustomerForm` + same route set using Resource Kit. Replace placeholder.
- **Phase D — Conversion actions:**
  - Lead detail → **Create Proposal** (prefill `lead_id`, name→title) + **Convert to Customer** (creates customer w/ `lead_id`, sets lead `won`).
  - Proposal detail → **Mark Accepted** + hint to convert lead.
  - Customer detail → **Create Project** (creates project w/ `customer_id`).
- **Phase E — Surface in Control Room:** make the Proposals/Customers cards link to real modules; add pipeline counts.

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
