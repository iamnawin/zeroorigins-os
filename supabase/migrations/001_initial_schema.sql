-- ZeroOrigins OS - MVP Phase 1 Schema

create extension if not exists "uuid-ossp";

-- Enum types
create type app_role as enum ('SUPER_ADMIN', 'FOUNDER', 'DIRECTOR', 'STAFF', 'CONTRACTOR', 'CUSTOMER', 'PARTNER', 'REFERRAL_PARTNER');
create type idea_status as enum ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'on_hold', 'converted_to_project', 'archived');
create type project_status as enum ('draft', 'planned', 'active', 'blocked', 'in_review', 'delivered', 'paused', 'cancelled', 'archived');
create type task_status as enum ('todo', 'in_progress', 'waiting', 'blocked', 'review', 'done', 'cancelled');
create type lead_status as enum ('new', 'contacted', 'discovery_scheduled', 'discovery_done', 'proposal_needed', 'proposal_sent', 'negotiation', 'won', 'lost', 'on_hold', 'archived');
create type partner_status as enum ('new_application', 'under_review', 'call_scheduled', 'approved', 'rejected', 'active', 'paused', 'archived');
create type proposal_status as enum ('draft', 'internal_review', 'sent', 'viewed', 'accepted', 'rejected', 'revision_requested', 'expired');
create type customer_request_status as enum ('submitted', 'under_review', 'discovery_call', 'proposal_shared', 'approved', 'in_progress', 'review', 'delivered', 'support', 'closed');
create type visibility_type as enum ('internal', 'customer_visible', 'partner_visible');
create type asset_visibility as enum ('internal', 'customer_visible', 'partner_visible', 'public');
create type org_type as enum ('internal', 'customer', 'partner', 'vendor');

-- Tables
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type org_type not null default 'customer',
  website text,
  contact_email text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text not null default '',
  role app_role not null default 'CUSTOMER',
  avatar_url text,
  organization_id uuid references organizations(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ideas (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text default '',
  status idea_status not null default 'draft',
  priority text check (priority in ('low', 'medium', 'high', 'critical')),
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table decisions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text default '',
  outcome text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'deferred')),
  idea_id uuid references ideas(id) on delete set null,
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text default '',
  status project_status not null default 'draft',
  priority text check (priority in ('low', 'medium', 'high', 'critical')),
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  customer_visible_summary text,
  start_date date,
  target_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status task_status not null default 'todo',
  project_id uuid references projects(id) on delete set null,
  assigned_to uuid references profiles(id),
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  customer_visible boolean default false,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  company text,
  source text,
  status lead_status not null default 'new',
  notes text,
  service_interest text,
  budget_range text,
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  company text,
  organization_id uuid references organizations(id),
  lead_id uuid references leads(id) on delete set null,
  profile_id uuid references profiles(id),
  status text default 'active' check (status in ('active', 'inactive', 'churned')),
  notes text,
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table partners (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  company text,
  type text,
  status partner_status not null default 'new_application',
  pitch text,
  notes text,
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  organization_id uuid references organizations(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table partner_referrals (
  id uuid primary key default uuid_generate_v4(),
  partner_id uuid references partners(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  status text default 'submitted',
  commission_amount numeric,
  commission_paid boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table proposals (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text,
  status proposal_status not null default 'draft',
  lead_id uuid references leads(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  amount numeric,
  customer_visible_notes text,
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table assets (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  file_path text,
  file_type text,
  file_size bigint,
  visibility asset_visibility not null default 'internal',
  project_id uuid references projects(id) on delete set null,
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table content_items (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text,
  type text default 'post' check (type in ('post', 'social', 'email', 'collateral', 'other')),
  status text default 'draft' check (status in ('draft', 'in_progress', 'review', 'published', 'archived')),
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table finance_transactions (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  currency text default 'USD',
  description text,
  category text,
  project_id uuid references projects(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  date date default current_date,
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table knowledge_articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text,
  category text,
  tags text[],
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table support_requests (
  id uuid primary key default uuid_generate_v4(),
  subject text not null,
  description text,
  status customer_request_status not null default 'submitted',
  customer_id uuid references customers(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  profile_id uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table comments (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid not null,
  content text not null,
  visibility visibility_type not null default 'internal',
  author_id uuid references profiles(id),
  created_at timestamptz default now()
);

create table activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) not null,
  title text not null,
  message text,
  read boolean default false,
  link text,
  created_at timestamptz default now()
);

-- Triggers
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on organizations for each row execute function update_updated_at();
create trigger set_updated_at before update on profiles for each row execute function update_updated_at();
create trigger set_updated_at before update on ideas for each row execute function update_updated_at();
create trigger set_updated_at before update on decisions for each row execute function update_updated_at();
create trigger set_updated_at before update on projects for each row execute function update_updated_at();
create trigger set_updated_at before update on tasks for each row execute function update_updated_at();
create trigger set_updated_at before update on leads for each row execute function update_updated_at();
create trigger set_updated_at before update on customers for each row execute function update_updated_at();
create trigger set_updated_at before update on partners for each row execute function update_updated_at();
create trigger set_updated_at before update on proposals for each row execute function update_updated_at();
create trigger set_updated_at before update on assets for each row execute function update_updated_at();
create trigger set_updated_at before update on content_items for each row execute function update_updated_at();
create trigger set_updated_at before update on finance_transactions for each row execute function update_updated_at();
create trigger set_updated_at before update on knowledge_articles for each row execute function update_updated_at();

-- Auto-create profile on signup (default: CUSTOMER)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'CUSTOMER');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table ideas enable row level security;
alter table decisions enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table leads enable row level security;
alter table customers enable row level security;
alter table partners enable row level security;
alter table partner_referrals enable row level security;
alter table proposals enable row level security;
alter table assets enable row level security;
alter table content_items enable row level security;
alter table finance_transactions enable row level security;
alter table knowledge_articles enable row level security;
alter table support_requests enable row level security;
alter table comments enable row level security;
alter table activity_logs enable row level security;
alter table notifications enable row level security;

create or replace function get_user_role()
returns app_role as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer stable;

create or replace function is_internal_user()
returns boolean as $$
  select get_user_role() in ('SUPER_ADMIN', 'FOUNDER', 'DIRECTOR', 'STAFF', 'CONTRACTOR')
$$ language sql security definer stable;

-- Policies
create policy "Users can view own profile" on profiles for select using (id = auth.uid());
create policy "Internal can view all profiles" on profiles for select using (is_internal_user());
create policy "Users can update own profile" on profiles for update using (id = auth.uid());

create policy "Internal can manage organizations" on organizations for all using (is_internal_user());
create policy "Internal can manage ideas" on ideas for all using (is_internal_user());
create policy "Internal can manage decisions" on decisions for all using (is_internal_user());
create policy "Internal can manage projects" on projects for all using (is_internal_user());
create policy "Internal can manage tasks" on tasks for all using (is_internal_user());

create policy "Internal can manage leads" on leads for all using (is_internal_user());
create policy "Public can submit leads" on leads for insert with check (true);

create policy "Internal can manage customers" on customers for all using (is_internal_user());
create policy "Customer can view own record" on customers for select using (profile_id = auth.uid());

create policy "Internal can manage partners" on partners for all using (is_internal_user());
create policy "Public can submit partner applications" on partners for insert with check (true);

create policy "Internal can manage referrals" on partner_referrals for all using (is_internal_user());
create policy "Internal can manage proposals" on proposals for all using (is_internal_user());

create policy "Internal can manage assets" on assets for all using (is_internal_user());
create policy "Public can view public assets" on assets for select using (visibility = 'public');

create policy "Internal can manage content" on content_items for all using (is_internal_user());
create policy "Internal can manage finance" on finance_transactions for all using (is_internal_user());
create policy "Internal can manage knowledge" on knowledge_articles for all using (is_internal_user());

create policy "Internal can manage support" on support_requests for all using (is_internal_user());
create policy "Users can view own support requests" on support_requests for select using (profile_id = auth.uid());
create policy "Users can create support requests" on support_requests for insert with check (profile_id = auth.uid());

create policy "Internal can manage comments" on comments for all using (is_internal_user());
create policy "Customer can see customer-visible comments" on comments for select
  using (visibility = 'customer_visible' and get_user_role() = 'CUSTOMER');
create policy "Partner can see partner-visible comments" on comments for select
  using (visibility = 'partner_visible' and get_user_role() in ('PARTNER', 'REFERRAL_PARTNER'));

create policy "Internal can view activity" on activity_logs for select using (is_internal_user());
create policy "System can insert activity" on activity_logs for insert with check (true);

create policy "Users see own notifications" on notifications for select using (user_id = auth.uid());
create policy "Users can update own notifications" on notifications for update using (user_id = auth.uid());
create policy "System can insert notifications" on notifications for insert with check (true);

-- Seed
insert into organizations (name, type) values ('ZeroOrigins', 'internal');
