-- Migration: Apply simplified role model data changes
-- Depends on 006_simplify_roles.sql (enum values must exist first)

-- 1. Add title (display-only, not used for permissions) and status columns
alter table profiles
  add column if not exists title text,
  add column if not exists status text not null default 'active'
    constraint profiles_status_check check (status in ('active', 'pending', 'disabled'));

-- 2. Migrate existing internal users to new roles
update profiles set role = 'admin'    where role in ('SUPER_ADMIN', 'FOUNDER');
update profiles set role = 'employee' where role in ('DIRECTOR', 'STAFF', 'CONTRACTOR');

-- 3. Update handle_new_user trigger:
--    @zeroorigins.in email → employee + active
--    all other emails    → CUSTOMER + active
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when new.email ilike '%@zeroorigins.in' then 'employee'
      else 'CUSTOMER'
    end,
    'active'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 4. Update is_internal_user() to recognise new roles only
create or replace function is_internal_user()
returns boolean as $$
  select get_user_role() in ('admin', 'employee')
$$ language sql security definer stable;
