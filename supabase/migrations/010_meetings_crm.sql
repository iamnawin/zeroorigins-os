-- Migration 010: CRM meetings
--
-- Adds first-party meeting records so the internal CRM can track scheduled
-- discovery calls, proposal reviews, delivery check-ins, and follow-up actions
-- without depending on external calendar sync in v1.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'meeting_status') then
    create type meeting_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
  end if;
end$$;

create table if not exists meetings (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  entity_type text not null default 'internal'
    check (entity_type in ('lead', 'deal', 'customer', 'project', 'partner', 'internal')),
  entity_id uuid,
  lead_id uuid references leads(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  attendees text[] not null default '{}',
  agenda text,
  outcome text,
  next_action text,
  status meeting_status not null default 'scheduled',
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_meetings_scheduled_at on meetings(scheduled_at);
create index if not exists idx_meetings_status on meetings(status);
create index if not exists idx_meetings_lead_id on meetings(lead_id);
create index if not exists idx_meetings_deal_id on meetings(deal_id);
create index if not exists idx_meetings_customer_id on meetings(customer_id);
create index if not exists idx_meetings_project_id on meetings(project_id);

drop trigger if exists set_updated_at on meetings;
create trigger set_updated_at before update on meetings
  for each row execute function update_updated_at();

alter table meetings enable row level security;
drop policy if exists "Internal can manage meetings" on meetings;
create policy "Internal can manage meetings" on meetings for all
  using (is_internal_user())
  with check (is_internal_user());
