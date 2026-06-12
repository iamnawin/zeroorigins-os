-- Migration 011: Company spending and vendor tracking
-- Keeps operating expenses separate from sales revenue while preserving
-- the existing finance_transactions ledger.

create table if not exists vendors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  website text,
  contact_email text,
  category text,
  notes text,
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table finance_transactions
  add column if not exists vendor_id uuid references vendors(id) on delete set null,
  add column if not exists status text not null default 'paid' check (status in ('planned', 'due', 'paid', 'overdue', 'cancelled')),
  add column if not exists due_date date,
  add column if not exists paid_at date,
  add column if not exists invoice_url text,
  add column if not exists receipt_url text,
  add column if not exists recurrence_interval text not null default 'none' check (recurrence_interval in ('none', 'monthly', 'quarterly', 'yearly')),
  add column if not exists next_due_date date,
  add column if not exists ai_workspace_app_id uuid references ai_workspace_apps(id) on delete set null,
  add column if not exists notes text;

create index if not exists idx_vendors_name on vendors(name);
create index if not exists idx_finance_transactions_vendor_id on finance_transactions(vendor_id);
create index if not exists idx_finance_transactions_status on finance_transactions(status);
create index if not exists idx_finance_transactions_due_date on finance_transactions(due_date);
create index if not exists idx_finance_transactions_category on finance_transactions(category);
create index if not exists idx_finance_transactions_ai_workspace_app_id on finance_transactions(ai_workspace_app_id);

drop trigger if exists set_updated_at on vendors;
create trigger set_updated_at before update on vendors for each row execute function update_updated_at();

alter table vendors enable row level security;

drop policy if exists "Internal can manage vendors" on vendors;
create policy "Internal can manage vendors" on vendors
  for all
  using (is_internal_user())
  with check (is_internal_user());

drop policy if exists "Internal can manage finance" on finance_transactions;
create policy "Internal can manage finance" on finance_transactions
  for all
  using (is_internal_user())
  with check (is_internal_user());
