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

## 🔜 Priority 1 — Lead → Proposal → Customer → Project flow

**Scope:** Full modules + conversion (decided 2026-06-08).

### Phase A — Schema
- [ ] `supabase/migrations/004_pipeline_links.sql`: add `projects.customer_id` (+ index)
- [ ] Update `Project` interface in `src/types/index.ts`

### Phase B — Proposals module
- [ ] `src/components/forms/ProposalForm.tsx`
- [ ] `/internal/proposals` (list, Resource Kit) — replace placeholder
- [ ] `/internal/proposals/new`, `/[id]`, `/[id]/edit`

### Phase C — Customers module
- [ ] `src/components/forms/CustomerForm.tsx`
- [ ] `/internal/customers` (list, Resource Kit) — replace placeholder
- [ ] `/internal/customers/new`, `/[id]`, `/[id]/edit`

### Phase D — Conversion actions
- [ ] Lead detail: **Create Proposal** (prefill `lead_id`)
- [ ] Lead detail: **Convert to Customer** (carry `lead_id`, set lead `won`, dedupe by email)
- [ ] Proposal detail: **Mark Accepted** (+ convert hint)
- [ ] Customer detail: **Create Project** (set `projects.customer_id`)

### Phase E — Control Room integration
- [ ] Proposals/Customers cards link to real modules
- [ ] Pipeline counts (proposals sent, customers active, won leads)

---

## 🔭 Priority 2 — Detail page enrichment
- [ ] Show contact/automation fields on lead & partner detail pages

## 🔭 Priority 3 — Portals
- [ ] Customer portal dashboard (real, scoped)
- [ ] Partner portal dashboard (real, scoped)

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
