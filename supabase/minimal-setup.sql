-- Minimal Database Setup - Run this in Supabase SQL Editor

-- Create missing tables
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text default '',
  status text not null default 'draft',
  priority text default 'medium',
  owner_id uuid references profiles(id),
  created_by uuid references profiles(id),
  customer_id uuid,
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

-- Enable RLS
alter table projects enable row level security;
alter table tasks enable row level security;

-- Create policies for internal users
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