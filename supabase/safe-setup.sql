-- ZeroOrigins OS - Safe Database Setup
-- This script safely creates only missing tables and policies

-- Enable extensions (safe to run multiple times)
create extension if not exists "uuid-ossp";

-- Create tables only if they don't exist
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null default 'customer',
  website text,
  contact_email text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'CUSTOMER',
  title text,
  status text not null default 'active' check (status in ('active', 'pending', 'disabled')),
  avatar_url text,
  organization_id uuid references organizations(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ideas (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text default '',
  status text not null default 'draft',
  priority text default 'medium',
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text default '',
  status text not null default 'draft',
  priority text default 'medium',
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  customer_id uuid,
  customer_visible_summary text,
  start_date date,
  target_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text default '',
  status text not null default 'todo',
  project_id uuid references projects(id),
  assigned_to uuid references profiles(id),
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  customer_visible boolean default false,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  company text,
  source text,
  status text not null default 'new',
  notes text,
  service_interest text,
  budget_range text,
  phone text,
  whatsapp text,
  website text,
  source_detail text,
  preferred_contact_method text,
  preferred_call_time text,
  last_contacted_at timestamptz,
  automation_status text,
  automation_source text,
  n8n_workflow_id text,
  external_reference_id text,
  ai_summary text,
  ai_score numeric,
  qualification_notes text,
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists partners (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  company text,
  type text,
  status text not null default 'new_application',
  pitch text,
  notes text,
  phone text,
  whatsapp text,
  website text,
  linkedin text,
  source_detail text,
  automation_status text,
  automation_source text,
  n8n_workflow_id text,
  external_reference_id text,
  ai_summary text,
  ai_score numeric,
  qualification_notes text,
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  organization_id uuid references organizations(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ai_workspace_apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  description text,
  category text,
  app_type text,
  status text default 'idea',
  priority text default 'medium',
  local_path text,
  repo_path text,
  github_url text,
  vercel_url text,
  live_url text,
  prototype_url text,
  website_url text,
  brand_url text,
  docs_url text,
  tech_stack text[],
  folder_group text,
  owner text,
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  is_client_demo boolean default false,
  is_sellable_product boolean default false,
  is_internal_tool boolean default true,
  is_open_source boolean default false,
  is_live boolean default false,
  is_delivered boolean default false,
  current_version text,
  current_issue text,
  next_action text,
  blockers text,
  business_value text,
  target_user text,
  monetization_idea text,
  last_checked_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists ai_workspace_apps_slug_key
  on ai_workspace_apps(slug);

-- Enable RLS (safe to run multiple times)
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table ideas enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table leads enable row level security;
alter table partners enable row level security;
alter table ai_workspace_apps enable row level security;

-- Drop existing policies to recreate them
drop policy if exists "Users can insert own profile" on profiles;
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Internal users can manage ideas" on ideas;
drop policy if exists "Internal users can manage projects" on projects;
drop policy if exists "Internal users can manage tasks" on tasks;
drop policy if exists "Internal users can manage leads" on leads;
drop policy if exists "Internal users can manage partners" on partners;
drop policy if exists "Internal users can manage organizations" on organizations;
drop policy if exists "Internal users can manage AI Workspace Apps" on ai_workspace_apps;

-- Create RLS policies
create policy "Users can insert own profile" 
  on profiles for insert 
  with check (
    auth.uid() = id
    and lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
    and coalesce(status, 'active') = 'active'
    and (
      role = 'CUSTOMER'
      or (
        role = 'employee'
        and lower(email) like '%@zeroorigins.in'
      )
    )
  );

create policy "Users can view own profile" 
  on profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on profiles for update 
  using (auth.uid() = id);

create policy "Internal users can manage ideas" 
  on ideas for all 
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role in ('admin', 'employee')
    )
  );

create policy "Internal users can manage projects" 
  on projects for all 
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role in ('admin', 'employee')
    )
  );

create policy "Internal users can manage tasks" 
  on tasks for all 
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role in ('admin', 'employee')
    )
  );

create policy "Internal users can manage leads" 
  on leads for all 
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role in ('admin', 'employee')
    )
  );

create policy "Internal users can manage partners" 
  on partners for all 
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role in ('admin', 'employee')
    )
  );

create policy "Internal users can manage organizations" 
  on organizations for all 
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role in ('admin', 'employee')
    )
  );

create policy "Internal users can manage AI Workspace Apps" 
  on ai_workspace_apps for all 
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role in ('admin', 'employee')
      and coalesce(status, 'active') = 'active'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin', 'employee')
      and coalesce(status, 'active') = 'active'
    )
  );

-- Sample data (will not duplicate if already exists)
insert into ai_workspace_apps (name, category, app_type, status, local_path, business_value, next_action) values 
('ZeroOrigins OS', 'internal_tool', 'nextjs_app', 'in_progress', 'D:\AI-Workspace\Repos\zeroorigins-os', 'Internal company operating system', 'Stabilize auth and dashboard'),
('PlotDNA', 'saas_product', 'ai_agent', 'testing', 'D:\AI-Workspace\Repos\plotdna', 'AI story plotting platform', 'Launch beta testing')
on conflict (name) do nothing;
