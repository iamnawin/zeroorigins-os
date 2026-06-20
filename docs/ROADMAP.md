# ZeroOrigins OS — Roadmap

> Forward plan. Companion to `docs/CONTEXT_HANDOFF.md` (current state + history).
> Priorities are ordered. Check items off as they ship.

**Last updated:** 2026-06-08

---

## ✅ Done

- [x] Internal CRUD for Ideas, Projects, Tasks, Leads, Partners (Resource Kit, status lifecycle, Active/All filters)
- [x] Public intake forms (`/request-build`, `/partner-with-us`) with contact/automation fields
- [x] Auth: `@zeroorigins.in` enforcement, role-based redirects, profile self-healing, email confirmation
- [x] Root gateway (3-path, permanent)
- [x] **Internal Control Room** — real operating dashboard
- [x] **AI Workspace** — manual-first module (CRUD + seed)

---

## 🔜 Priority 1 — Lead → Deal → Proposal → Customer → Project flow

**Scope:** Full modules + conversion (decided 2026-06-08).
**Chain:** Lead Captured → Qualified Lead → Create Deal → Create Proposal → Proposal Accepted → Convert to Customer → Create Project.
**Conversion:** manual + guided buttons only — no silent cascades; prefill from parent; dedupe by email.

### Phase A — Schema ✅ (`supabase/migrations/005_deals_and_pipeline_links.sql`)
- [x] New enum `deal_stage` + `deals` table (name, lead_id, stage, estimated_value, expected_close_date, owner_id, next_step, notes)
- [x] `proposals.deal_id` → `deals(id)`
- [x] `projects.customer_id` → `customers(id)`
- [x] Indexes on new FKs; RLS `is_internal_user()` for `deals`; `set_updated_at` trigger
- [x] Update `src/types/index.ts` (`Deal`, `DEAL_STAGES`, `Proposal.deal_id`, `Project.customer_id`)
- [ ] **Apply migration to remote DB** (manual — project not MCP-accessible)

### Phase B — Deals module
- [ ] `src/components/forms/DealForm.tsx`
- [ ] `/internal/deals` (list, Resource Kit), `/new`, `/[id]`, `/[id]/edit`
- [ ] Sidebar item: Deals

### Phase C — Proposals module
- [ ] `src/components/forms/ProposalForm.tsx`
- [ ] `/internal/proposals` (list, Resource Kit) — replace placeholder
- [ ] `/internal/proposals/new`, `/[id]`, `/[id]/edit`

### Phase D — Customers module
- [ ] `src/components/forms/CustomerForm.tsx`
- [ ] `/internal/customers` (list, Resource Kit) — replace placeholder
- [ ] `/internal/customers/new`, `/[id]`, `/[id]/edit`

### Phase E — Conversion actions (manual + guided)
- [ ] Lead detail: **Qualify Lead** + **Create Deal** (prefill from lead; prompt when qualified)
- [ ] Deal detail: **Create Proposal** (prefill `deal_id`/`lead_id`)
- [ ] Proposal detail: **Mark Accepted** (+ convert hint)
- [ ] Lead/Deal: **Convert to Customer** (carry `lead_id`, set lead `won`, dedupe by email → link instead)
- [ ] Customer detail: **Create Project** (set `projects.customer_id`)

### Phase F — Control Room integration
- [ ] Deals/Proposals/Customers cards link to real modules
- [ ] Pipeline counts (open deals, proposals sent, customers active, won leads)

---

## 🔭 Priority 2 — Detail page enrichment
- [ ] Show contact/automation fields on lead & partner detail pages

## 🔭 Priority 3 — Portals
- [ ] Customer portal dashboard (real, scoped)
- [ ] Partner portal dashboard (real, scoped)

## Priority 4 - Reminder + Notification Engine
- [ ] Phase 1: task reminders, notification events, preferences, global bell, in-app sound, due/overdue processing
- [ ] Phase 2: browser/PWA push foundation and push subscriptions
- [ ] Phase 3: Telegram/n8n fallback after first-party reminders are stable
- [ ] See `docs/reminder-notification-engine.md`

## 🧊 Deferred (do NOT build yet)
- GitHub/Vercel sync for AI Workspace
- n8n integration / AI automation
- AI helpers in `src/lib/ai/*` (currently stubs)
- Payments / partner commission
- Hard delete (SUPER_ADMIN-only, with confirm + audit — Phase 2+)

---

## Conventions reminder
- Match Resource Kit patterns for new list pages (`docs/RESOURCE_KIT.md`).
- New status value = edit **both** the Postgres enum (new migration) **and** the `as const` union in `src/types/index.ts`.
- New form field = add the DB column (migration) **before** wiring the form.
- Update **both** `middleware.ts`/`proxy.ts` **and** the RLS policy when adding a role or protected route.
