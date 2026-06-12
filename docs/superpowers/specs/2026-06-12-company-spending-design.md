# Company Spending Design

## Goal
Build a finance slice that tracks ZeroOrigins company spending separately from sales revenue, while leaving room for n8n, calendar reminders, and Together AI automation.

## Scope
V1 covers operating spending only: vendor bills, subscriptions, one-time expenses, AI/API usage, contractor costs, domains, software, marketing, and project-linked costs. Revenue remains in deals, proposals, customers, and projects.

## Data Model
Add a `vendors` table for payees such as Vercel, Supabase, Together AI, Google Workspace, and contractors. Extend `finance_transactions` into a proper spending ledger with status, vendor link, recurrence metadata, invoice/receipt URL, due date, paid date, notes, and optional links to project/customer/AI app.

Statuses are `planned`, `due`, `paid`, `overdue`, and `cancelled`. Categories are stored as text for flexibility, but the UI should offer useful defaults: hosting, ai_api, software, domain, contractor, marketing, operations, project_cost, tax, other.

## UX
`/internal/finance` becomes the company spending dashboard for admin users. It shows this month's spend, upcoming bills, overdue bills, AI/API spend, and spending by category. It also includes a table/list of spending records and actions to add vendors or expenses.

`/internal/finance/expenses/new` creates a spending record. `vendors` can be added from `/internal/finance/vendors/new`. Detail/edit routes can follow after the first slice if needed, but the first implementation should make records save correctly and appear immediately.

## Automation
The CRM database is the source of truth. n8n can later create or update records from invoice emails, bank exports, webhooks, and billing APIs. Calendar sync should create reminders from finance records, not replace finance records.

Together AI should be introduced through a model-router foundation, not direct calls scattered through UI components. Cheap extraction/classification/summarization work should default to `Qwen/Qwen3.5-9B` or `openai/gpt-oss-20b`; stronger models should be reserved for complex proposal, planning, or reasoning tasks.

## Safety
All finance mutations must go through server actions and call internal authorization. Client components must not directly write Supabase finance tables. Finance pages stay admin-only through existing navigation and RLS.

## Verification
Tests should prove finance forms use server actions, finance actions revalidate `/internal/finance`, finance routes exist, migrations create vendors/spending fields/RLS, and Together model routing chooses cheap models for simple CRM AI tasks.
