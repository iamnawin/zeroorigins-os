-- Migration 009: make auth/profile repair and AI workspace sync reliable.
--
-- This keeps the simplified role model aligned across signup, login self-heal,
-- RLS checks, and AI workspace upserts.

alter table profiles
  add column if not exists title text,
  add column if not exists status text not null default 'active';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_status_check'
      and conrelid = 'profiles'::regclass
  ) then
    alter table profiles
      add constraint profiles_status_check
      check (status in ('active', 'pending', 'disabled'));
  end if;
end $$;

update profiles set role = 'admin' where role::text in ('SUPER_ADMIN', 'FOUNDER');
update profiles set role = 'employee' where role::text in ('DIRECTOR', 'STAFF', 'CONTRACTOR');

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when lower(coalesce(new.email, '')) like '%@zeroorigins.in' then 'employee'
      else 'CUSTOMER'
    end,
    'active'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace function is_internal_user()
returns boolean as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
      and role::text in ('admin', 'employee')
      and coalesce(status, 'active') = 'active'
  )
$$ language sql security definer stable;

drop policy if exists "Users can insert own profile" on profiles;

create policy "Users can insert own profile"
  on profiles for insert
  with check (
    id = auth.uid()
    and lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
    and coalesce(status, 'active') = 'active'
    and (
      role::text = 'CUSTOMER'
      or (
        role::text = 'employee'
        and lower(email) like '%@zeroorigins.in'
      )
    )
  );

drop policy if exists "Internal users can manage AI Workspace Apps" on ai_workspace_apps;

create policy "Internal users can manage AI Workspace Apps"
  on ai_workspace_apps for all
  using (is_internal_user())
  with check (is_internal_user());

create unique index if not exists ai_workspace_apps_slug_key
  on ai_workspace_apps(slug);
