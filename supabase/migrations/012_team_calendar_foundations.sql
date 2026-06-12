-- Migration 012: team calendar foundations
--
-- Adds first-party calendar identity metadata for internal profiles while
-- keeping external calendar sync deferred. Meetings already carry owner_id;
-- this migration makes that ownership efficient to filter.

alter table profiles
  add column if not exists calendar_email text,
  add column if not exists calendar_provider text not null default 'none',
  add column if not exists calendar_sync_enabled boolean not null default false,
  add column if not exists calendar_sync_status text not null default 'not_connected';

alter table profiles
  drop constraint if exists profiles_calendar_provider_check;

alter table profiles
  add constraint profiles_calendar_provider_check
  check (calendar_provider in ('none', 'google'));

alter table profiles
  drop constraint if exists profiles_calendar_sync_status_check;

alter table profiles
  add constraint profiles_calendar_sync_status_check
  check (calendar_sync_status in ('not_connected', 'ready', 'paused', 'error'));

create index if not exists idx_profiles_calendar_email on profiles(calendar_email);
create index if not exists idx_meetings_owner_id on meetings(owner_id);
