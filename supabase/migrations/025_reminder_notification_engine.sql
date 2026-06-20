-- Reminder and notification engine foundation.
-- This migration is additive: existing task rows and legacy notifications remain intact.

alter table tasks add column if not exists due_at timestamptz;
alter table tasks add column if not exists priority text not null default 'normal';
alter table tasks add column if not exists reminder_enabled boolean not null default false;
alter table tasks add column if not exists reminder_at timestamptz;
alter table tasks add column if not exists repeat_rule text;
alter table tasks add column if not exists completed_at timestamptz;
alter table tasks add column if not exists cancelled_at timestamptz;
alter table tasks add column if not exists related_record_type text;
alter table tasks add column if not exists related_record_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_priority_check'
      and conrelid = 'tasks'::regclass
  ) then
    alter table tasks
      add constraint tasks_priority_check
      check (priority in ('low', 'normal', 'high', 'urgent'));
  end if;
end $$;

create table if not exists task_reminders (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  reminder_at timestamptz not null,
  status text not null default 'scheduled',
  priority text not null default 'normal',
  channel text not null default 'in_app',
  sound_type text not null default 'default',
  repeat_rule text,
  last_triggered_at timestamptz,
  next_trigger_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_reminders_status_check check (status in ('scheduled', 'triggered', 'completed', 'cancelled')),
  constraint task_reminders_priority_check check (priority in ('low', 'normal', 'high', 'urgent')),
  constraint task_reminders_channel_check check (channel in ('in_app', 'email', 'telegram', 'whatsapp'))
);

create table if not exists notification_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  event_type text not null,
  title text not null,
  message text,
  severity text not null default 'info',
  status text not null default 'unread',
  channel text not null default 'in_app',
  related_record_type text,
  related_record_id uuid,
  task_id uuid references tasks(id) on delete set null,
  reminder_id uuid references task_reminders(id) on delete set null,
  action_url text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_events_severity_check check (severity in ('info', 'success', 'warning', 'urgent')),
  constraint notification_events_status_check check (status in ('unread', 'read', 'dismissed')),
  constraint notification_events_channel_check check (channel in ('in_app', 'browser_push', 'email', 'telegram', 'whatsapp'))
);

create table if not exists notification_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  in_app_enabled boolean not null default true,
  browser_push_enabled boolean not null default false,
  email_enabled boolean not null default false,
  telegram_enabled boolean not null default false,
  whatsapp_enabled boolean not null default false,
  sound_enabled boolean not null default true,
  urgent_sound_enabled boolean not null default true,
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_task_reminders_active_task
  on task_reminders(task_id)
  where status = 'scheduled';

create unique index if not exists idx_notification_events_reminder_once
  on notification_events(reminder_id, event_type);

create index if not exists idx_task_reminders_due
  on task_reminders(status, reminder_at);

create index if not exists idx_notification_events_user_status_created
  on notification_events(user_id, status, created_at desc);

create unique index if not exists idx_notification_preferences_user
  on notification_preferences(user_id);

drop trigger if exists set_updated_at_task_reminders on task_reminders;
create trigger set_updated_at_task_reminders
  before update on task_reminders
  for each row execute function update_updated_at();

drop trigger if exists set_updated_at_notification_events on notification_events;
create trigger set_updated_at_notification_events
  before update on notification_events
  for each row execute function update_updated_at();

drop trigger if exists set_updated_at_notification_preferences on notification_preferences;
create trigger set_updated_at_notification_preferences
  before update on notification_preferences
  for each row execute function update_updated_at();

alter table task_reminders enable row level security;
alter table notification_events enable row level security;
alter table notification_preferences enable row level security;

drop policy if exists "Internal can manage task reminders" on task_reminders;
create policy "Internal can manage task reminders" on task_reminders
  for all using (is_internal_user())
  with check (is_internal_user());

drop policy if exists "Internal can manage notification events" on notification_events;
create policy "Internal can manage notification events" on notification_events
  for all using (is_internal_user())
  with check (is_internal_user());

drop policy if exists "Users can manage own notification preferences" on notification_preferences;
create policy "Users can manage own notification preferences" on notification_preferences
  for all using (user_id = auth.uid() or is_internal_user())
  with check (user_id = auth.uid() or is_internal_user());
