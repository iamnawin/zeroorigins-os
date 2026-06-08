-- Migration 005: Deals (Opportunities) + pipeline links
--
-- Adds the lightweight Deal/Opportunity stage between a qualified lead and a
-- proposal, and the two missing FK links that complete the conversion chain:
--   Lead -> Deal -> Proposal -> Customer -> Project
--
-- Conversion remains MANUAL + guided in the app (no DB-side cascades here).

-- Deal lifecycle stages (mirrored as DEAL_STAGES in src/types/index.ts)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'deal_stage') then
    create type deal_stage as enum ('qualifying', 'proposal', 'negotiation', 'won', 'lost', 'on_hold');
  end if;
end$$;

create table if not exists deals (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  lead_id uuid references leads(id) on delete set null,
  stage deal_stage not null default 'qualifying',
  estimated_value numeric,
  expected_close_date date,
  owner_id uuid references profiles(id),
  next_step text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Link proposals to a deal; link projects directly to a customer.
alter table proposals add column if not exists deal_id uuid references deals(id) on delete set null;
alter table projects  add column if not exists customer_id uuid references customers(id) on delete set null;

-- Indexes for the new FKs
create index if not exists idx_deals_lead_id on deals(lead_id);
create index if not exists idx_deals_owner_id on deals(owner_id);
create index if not exists idx_deals_stage on deals(stage);
create index if not exists idx_proposals_deal_id on proposals(deal_id);
create index if not exists idx_projects_customer_id on projects(customer_id);

-- updated_at trigger (matches the pattern in 001_initial_schema.sql)
drop trigger if exists set_updated_at on deals;
create trigger set_updated_at before update on deals
  for each row execute function update_updated_at();

-- RLS: internal users manage deals (same pattern as other internal tables)
alter table deals enable row level security;
drop policy if exists "Internal can manage deals" on deals;
create policy "Internal can manage deals" on deals for all using (is_internal_user());
