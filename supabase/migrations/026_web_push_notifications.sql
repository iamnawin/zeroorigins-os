create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  device_label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user_active
  on push_subscriptions(user_id, is_active);

drop trigger if exists set_updated_at_push_subscriptions on push_subscriptions;
create trigger set_updated_at_push_subscriptions
  before update on push_subscriptions
  for each row execute function update_updated_at();

alter table push_subscriptions enable row level security;

drop policy if exists "Users can view own push subscriptions" on push_subscriptions;
create policy "Users can view own push subscriptions" on push_subscriptions
  for select using (user_id = auth.uid());

drop policy if exists "Users can insert own push subscriptions" on push_subscriptions;
create policy "Users can insert own push subscriptions" on push_subscriptions
  for insert with check (user_id = auth.uid());

drop policy if exists "Users can update own push subscriptions" on push_subscriptions;
create policy "Users can update own push subscriptions" on push_subscriptions
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own push subscriptions" on push_subscriptions;
create policy "Users can delete own push subscriptions" on push_subscriptions
  for delete using (user_id = auth.uid());

grant select, insert, update, delete on push_subscriptions to authenticated;
grant all on push_subscriptions to service_role;
