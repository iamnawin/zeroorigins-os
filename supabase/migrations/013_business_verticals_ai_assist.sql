-- Migration 013: business verticals and AI assist drafts
--
-- Separates brands/products/initiatives from AI capability tooling and
-- stores AI Assist outputs as confirmation-gated drafts.

create table if not exists business_verticals (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  type text not null default 'internal' check (type in ('brand', 'product', 'education', 'media', 'internal', 'client_service', 'experiment')),
  status text not null default 'idea' check (status in ('idea', 'active', 'paused', 'archived')),
  description text,
  owner text,
  website text,
  logo_url text,
  brand_color text,
  notes text,
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ai_assist_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  intent text not null check (intent in ('create_task', 'schedule_meeting', 'draft_email', 'summarize_email', 'create_followup', 'create_proposal', 'classify_lead', 'summarize_day')),
  input_text text not null,
  ai_output_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'created', 'failed', 'cancelled')),
  related_vertical_id uuid references business_verticals(id) on delete set null,
  related_task_id uuid references tasks(id) on delete set null,
  related_meeting_id uuid references meetings(id) on delete set null,
  related_lead_id uuid references leads(id) on delete set null,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table projects add column if not exists related_vertical_id uuid references business_verticals(id) on delete set null;
alter table tasks add column if not exists related_vertical_id uuid references business_verticals(id) on delete set null;
alter table leads add column if not exists related_vertical_id uuid references business_verticals(id) on delete set null;
alter table proposals add column if not exists related_vertical_id uuid references business_verticals(id) on delete set null;
alter table meetings add column if not exists related_vertical_id uuid references business_verticals(id) on delete set null;
alter table finance_transactions add column if not exists related_vertical_id uuid references business_verticals(id) on delete set null;

alter table meetings
  add column if not exists source text not null default 'manual' check (source in ('manual', 'google_calendar')),
  add column if not exists calendar_event_id text,
  add column if not exists meeting_link text,
  add column if not exists notes text,
  add column if not exists sync_status text not null default 'not_connected' check (sync_status in ('not_connected', 'ready', 'paused', 'error'));

alter table vendors
  add column if not exists currency text not null default 'INR' check (currency in ('INR', 'USD', 'EUR', 'GBP')),
  add column if not exists monthly_cost numeric(12,2),
  add column if not exists billing_cycle text not null default 'monthly' check (billing_cycle in ('none', 'monthly', 'quarterly', 'yearly')),
  add column if not exists renewal_date date,
  add column if not exists owner text,
  add column if not exists status text not null default 'active' check (status in ('active', 'paused', 'cancelled'));

insert into business_verticals (name, slug, type, status, description)
values
  ('AIWithNoBrain', 'aiwithnobrain', 'media', 'active', 'AI content/brand initiative.'),
  ('AIWithNoBrain Audio Labs', 'aiwithnobrain-audio-labs', 'experiment', 'active', 'Experimental musical AI lab.'),
  ('IgnAIte', 'ignaite', 'education', 'active', 'AI learning/workshop/course vertical.'),
  ('EpicsToYou', 'epicstoyou', 'media', 'active', 'Video storytelling / creative-tech / AI content vertical.'),
  ('ZeroOrigins OS', 'zeroorigins-os', 'internal', 'active', 'Internal operating system for ZeroOrigins.')
on conflict (slug) do update set
  name = excluded.name,
  type = excluded.type,
  status = excluded.status,
  description = excluded.description;

create index if not exists idx_business_verticals_slug on business_verticals(slug);
create index if not exists idx_business_verticals_status on business_verticals(status);
create index if not exists idx_business_verticals_type on business_verticals(type);
create index if not exists idx_ai_assist_requests_user_id on ai_assist_requests(user_id);
create index if not exists idx_ai_assist_requests_status on ai_assist_requests(status);
create index if not exists idx_ai_assist_requests_intent on ai_assist_requests(intent);
create index if not exists idx_ai_assist_requests_related_vertical_id on ai_assist_requests(related_vertical_id);
create index if not exists idx_projects_related_vertical_id on projects(related_vertical_id);
create index if not exists idx_tasks_related_vertical_id on tasks(related_vertical_id);
create index if not exists idx_leads_related_vertical_id on leads(related_vertical_id);
create index if not exists idx_proposals_related_vertical_id on proposals(related_vertical_id);
create index if not exists idx_meetings_related_vertical_id on meetings(related_vertical_id);
create index if not exists idx_finance_transactions_related_vertical_id on finance_transactions(related_vertical_id);
create index if not exists idx_meetings_source on meetings(source);
create index if not exists idx_meetings_calendar_event_id on meetings(calendar_event_id);
create index if not exists idx_vendors_status on vendors(status);
create index if not exists idx_vendors_renewal_date on vendors(renewal_date);

drop trigger if exists set_updated_at on business_verticals;
create trigger set_updated_at before update on business_verticals for each row execute function update_updated_at();

drop trigger if exists set_updated_at on ai_assist_requests;
create trigger set_updated_at before update on ai_assist_requests for each row execute function update_updated_at();

alter table business_verticals enable row level security;
alter table ai_assist_requests enable row level security;

drop policy if exists "Internal can manage business verticals" on business_verticals;
create policy "Internal can manage business verticals" on business_verticals
  for all
  using (is_internal_user())
  with check (is_internal_user());

drop policy if exists "Internal can manage ai assist requests" on ai_assist_requests;
create policy "Internal can manage ai assist requests" on ai_assist_requests
  for all
  using (is_internal_user())
  with check (is_internal_user());
