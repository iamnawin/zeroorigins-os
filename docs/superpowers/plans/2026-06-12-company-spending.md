# Company Spending Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working company spending slice: vendors, expenses, recurring bill metadata, finance dashboard, and Together AI model routing foundation.

**Architecture:** Reuse the existing internal resource pattern. Server pages read from Supabase, client forms submit to `src/lib/actions/internal-resources.ts`, and migrations extend the existing finance table instead of replacing it.

**Tech Stack:** Next.js App Router, React Server/Client Components, Supabase, TypeScript, Node test runner, lucide icons, no new dependencies.

---

### File Structure

- Modify `scripts/internal-resource-actions.test.mjs`: regression coverage for finance forms, actions, routes, and migrations.
- Add `scripts/ai-model-router.test.mjs`: tests for task-to-model selection.
- Modify `src/types/index.ts`: `Vendor`, `FinanceTransaction`, status constants, category constants.
- Modify `src/lib/actions/internal-resources.ts`: `createVendor/updateVendor/createFinanceTransaction/updateFinanceTransaction`.
- Add `src/lib/ai/model-router.ts`: deterministic Together model selection for CRM AI tasks.
- Add `src/components/forms/VendorForm.tsx`: vendor create/edit form.
- Add `src/components/forms/FinanceTransactionForm.tsx`: spending create/edit form.
- Replace `src/app/(internal)/internal/finance/page.tsx`: spending dashboard.
- Add `src/app/(internal)/internal/finance/expenses/new/page.tsx`: new spending route.
- Add `src/app/(internal)/internal/finance/vendors/new/page.tsx`: new vendor route.
- Modify `src/components/layout/internal-sidebar.tsx`: mark Finance built.
- Add `supabase/migrations/011_company_spending.sql`: vendors and finance transaction extension.

### Task 1: Red Tests

- [ ] Add finance forms/routes/actions/migration expectations to `scripts/internal-resource-actions.test.mjs`.
- [ ] Add `scripts/ai-model-router.test.mjs` with cheap/default/escalated model behavior.
- [ ] Run `node --test scripts/internal-resource-actions.test.mjs scripts/ai-model-router.test.mjs`.
- [ ] Confirm tests fail because finance forms/actions/routes/migration/router are missing.

### Task 2: Database And Types

- [ ] Add `supabase/migrations/011_company_spending.sql` with `vendors`, finance columns, indexes, trigger, and RLS.
- [ ] Add `Vendor` and `FinanceTransaction` types/status/category constants in `src/types/index.ts`.
- [ ] Run the red tests again and confirm remaining failures point to app code.

### Task 3: Server Actions And Forms

- [ ] Add vendor and finance transaction server actions to `src/lib/actions/internal-resources.ts`.
- [ ] Add `VendorForm.tsx` and `FinanceTransactionForm.tsx`.
- [ ] Ensure forms import only server actions for mutation and do not directly write Supabase.
- [ ] Run `node --test scripts/internal-resource-actions.test.mjs`.

### Task 4: Finance Routes And Dashboard

- [ ] Replace finance coming-soon page with dashboard metrics, upcoming bills, overdue bills, category spend, and transaction table.
- [ ] Add new expense and vendor routes.
- [ ] Mark Finance as built in sidebar.
- [ ] Run `npx tsc --noEmit` and fix route/type issues.

### Task 5: Together AI Router

- [ ] Add `src/lib/ai/model-router.ts`.
- [ ] Route simple classify/extract/summarize tasks to cheap models and complex planning/reasoning to stronger models.
- [ ] Run `node --test scripts/ai-model-router.test.mjs`.

### Task 6: Verification And Publish

- [ ] Run `node --test scripts/*.test.mjs`.
- [ ] Run `npm run lint`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.
- [ ] Start or reuse local dev server.
- [ ] Commit with Lore protocol and push to `origin/main`.
