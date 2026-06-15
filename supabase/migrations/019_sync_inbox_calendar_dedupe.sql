-- Migration 019: Sync Inbox calendar dedupe foundation
--
-- Stores raw external sync signals and links them to canonical meetings so
-- admin/support/personal calendars can represent one real meeting.

create table if not exists sync_signals (
  id uuid primary key default uuid_generate_v4(),
  source_provider text not null,
  source_account_id uuid references profiles(id) on delete set null,
  source_account_email text,
  source_account_type text not null default 'personal',
  source_calendar_id text,
  source_object_id text not null,
  source_url text,
  title text,
  occurred_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  extracted_text text,
  dedupe_key text,
  suggested_record_type text,
  suggested_vertical_id uuid references business_verticals(id) on delete set null,
  confidence numeric(5,2) not null default 0,
  status text not null default 'new',
  related_meeting_id uuid references meetings(id) on delete set null,
  related_knowledge_article_id uuid references knowledge_articles(id) on delete set null,
  related_vendor_id uuid references vendors(id) on delete set null,
  related_finance_transaction_id uuid references finance_transactions(id) on delete set null,
  related_task_id uuid references tasks(id) on delete set null,
  error_message text,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (source_provider, source_account_id, source_object_id)
);

alter table sync_signals
  drop constraint if exists sync_signals_source_provider_check,
  add constraint sync_signals_source_provider_check
  check (source_provider in ('google_calendar', 'google_drive', 'finance', 'local_folder', 'gmail', 'github', 'youtube', 'form'));

alter table sync_signals
  drop constraint if exists sync_signals_source_account_type_check,
  add constraint sync_signals_source_account_type_check
  check (source_account_type in ('admin', 'support', 'personal'));

alter table sync_signals
  drop constraint if exists sync_signals_status_check,
  add constraint sync_signals_status_check
  check (status in ('new', 'needs_review', 'matched', 'created', 'ignored', 'error'));

alter table sync_signals
  drop constraint if exists sync_signals_suggested_record_type_check,
  add constraint sync_signals_suggested_record_type_check
  check (
    suggested_record_type is null
    or suggested_record_type in (
      'meeting',
      'prd',
      'brd',
      'company_doc',
      'sop',
      'storyboard',
      'content_plan',
      'training_material',
      'vendor_bill',
      'subscription',
      'project_note',
      'meeting_note',
      'task'
    )
  );

create table if not exists meeting_sync_links (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  sync_signal_id uuid not null references sync_signals(id) on delete cascade,
  source_provider text not null,
  source_account_id uuid references profiles(id) on delete set null,
  source_account_type text not null default 'personal',
  source_object_id text not null,
  match_confidence numeric(5,2) not null default 0,
  match_reason text,
  created_at timestamptz default now(),
  unique (meeting_id, sync_signal_id),
  unique (source_provider, source_account_id, source_object_id)
);

alter table meeting_sync_links
  drop constraint if exists meeting_sync_links_source_account_type_check,
  add constraint meeting_sync_links_source_account_type_check
  check (source_account_type in ('admin', 'support', 'personal'));

create index if not exists idx_sync_signals_status on sync_signals(status);
create index if not exists idx_sync_signals_source on sync_signals(source_provider, source_account_type);
create index if not exists idx_sync_signals_source_object on sync_signals(source_provider, source_object_id);
create index if not exists idx_sync_signals_dedupe_key on sync_signals(dedupe_key);
create index if not exists idx_sync_signals_related_meeting on sync_signals(related_meeting_id);
create index if not exists idx_meeting_sync_links_meeting on meeting_sync_links(meeting_id);
create index if not exists idx_meeting_sync_links_signal on meeting_sync_links(sync_signal_id);
create index if not exists idx_meeting_sync_links_source on meeting_sync_links(source_provider, source_account_type);

drop trigger if exists set_updated_at on sync_signals;
create trigger set_updated_at before update on sync_signals for each row execute function update_updated_at();

alter table sync_signals enable row level security;
alter table meeting_sync_links enable row level security;

drop policy if exists "Internal can manage sync signals" on sync_signals;
create policy "Internal can manage sync signals" on sync_signals
  for all
  using (is_internal_user())
  with check (is_internal_user());

drop policy if exists "Internal can manage meeting sync links" on meeting_sync_links;
create policy "Internal can manage meeting sync links" on meeting_sync_links
  for all
  using (is_internal_user())
  with check (is_internal_user());
