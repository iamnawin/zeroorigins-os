-- Migration 016: repair meeting calendar sync columns
--
-- Some remote databases received the business vertical parts of migration 013
-- without the meetings sync column additions. This idempotent repair keeps the
-- meetings table aligned with the app's Google Calendar sync payload.

alter table meetings
  add column if not exists source text not null default 'manual',
  add column if not exists calendar_event_id text,
  add column if not exists meeting_link text,
  add column if not exists notes text,
  add column if not exists sync_status text not null default 'not_connected';

alter table meetings
  drop constraint if exists meetings_source_check,
  add constraint meetings_source_check
  check (source in ('manual', 'google_calendar'));

alter table meetings
  drop constraint if exists meetings_sync_status_check,
  add constraint meetings_sync_status_check
  check (sync_status in ('not_connected', 'ready', 'paused', 'error'));

create index if not exists idx_meetings_source on meetings(source);
create index if not exists idx_meetings_calendar_event_id on meetings(calendar_event_id);
