-- ZeroOrigins OS - Database Setup
-- Run this script in your Supabase SQL Editor to set up all tables and data

-- Enable extensions
create extension if not exists "uuid-ossp";

-- Enum types
create type app_role as enum ('admin', 'employee', 'CUSTOMER', 'PARTNER', 'REFERRAL_PARTNER');
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

-- Organizations table
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type org_type not null default 'customer',
  website text,
  contact_email text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Profiles table
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text not null default '',
  role app_role not null default 'CUSTOMER',
  title text,
  status text not null default 'active' check (status in ('active', 'pending', 'disabled')),
  avatar_url text,
  organization_id uuid references organizations(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ideas table
create table if not exists ideas (
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

-- Projects table  
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text default '',
  status project_status not null default 'draft',
  priority text check (priority in ('low', 'medium', 'high', 'critical')),
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  customer_id uuid,
  customer_visible_summary text,
  start_date date,
  target_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tasks table
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text default '',
  status task_status not null default 'todo',
  project_id uuid references projects(id),
  assigned_to uuid references profiles(id),
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  customer_visible boolean default false,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Leads table
create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  company text,
  source text,
  status lead_status not null default 'new',
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

-- Partners table
create table if not exists partners (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  company text,
  type text,
  status partner_status not null default 'new_application',
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

-- AI Workspace Apps table
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

-- Enable RLS on all tables
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table ideas enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table leads enable row level security;
alter table partners enable row level security;
alter table ai_workspace_apps enable row level security;

-- RLS Policies for profiles (allow users to insert their own profile)
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

-- RLS Policies for internal users (admin/employee can manage everything)
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

-- Sample AI Workspace data
insert into ai_workspace_apps (name, category, app_type, status, local_path, business_value, next_action) values 
('ZeroOrigins OS', 'internal_tool', 'nextjs_app', 'in_progress', 'D:\AI-Workspace\Repos\zeroorigins-os', 'Internal company operating system for ideas, leads, partners, projects, and execution.', 'Stabilize auth gateway and internal dashboard.'),
('OrgTrace', 'saas_product', 'web_app', 'idea', 'D:\AI-Workspace\Repos\orgtrace', 'Organizational tracing and mapping tool.', 'Define MVP scope.'),
('PlotDNA', 'saas_product', 'ai_agent', 'testing', 'D:\AI-Workspace\Repos\plotdna', 'AI story plotting and DNA analysis for writers.', 'Finalize beta testing feedback.')
on conflict do nothing;
