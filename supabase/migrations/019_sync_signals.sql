-- Phase 1 sync inbox: raw signal intake + calendar deduplication links

create table if not exists sync_signals (
  id uuid primary key default gen_random_uuid(),

  -- Source identification
  source_provider text not null,       -- 'google_calendar', 'google_drive', 'gmail', 'github', 'youtube', 'form'
  source_account  text not null,       -- 'admin', 'support', or a team member email
  source_object_id text not null,      -- provider-native id (Google event id, Drive file id, etc.)
  source_payload  jsonb,               -- raw source data kept for audit and reprocessing

  -- Extracted content
  title           text,
  occurred_at     timestamptz,         -- event time / file modified time / etc.
  source_url      text,
  extracted_text  text,

  -- Classification
  suggested_record_type text,          -- 'meeting', 'document', 'task', 'vendor', etc.
  suggested_vertical_id uuid references business_verticals(id) on delete set null,
  confidence_score numeric(4,3) check (confidence_score >= 0 and confidence_score <= 1),

  -- Lifecycle
  status text not null default 'new'
    check (status in ('new', 'needs_review', 'matched', 'created', 'ignored', 'error')),

  -- Links to canonical records after review
  related_meeting_id uuid references meetings(id) on delete set null,
  -- generic pointer for non-meeting records
  related_record_type text,
  related_record_id uuid,

  -- Review audit
  reviewed_by   uuid references profiles(id) on delete set null,
  reviewed_at   timestamptz,
  review_action text,
  error_message text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One signal per (provider, account, object) — prevents double-importing the same external event
create unique index if not exists sync_signals_source_dedup_idx
  on sync_signals(source_provider, source_account, source_object_id);

create index if not exists sync_signals_status_idx on sync_signals(status);
create index if not exists sync_signals_provider_idx on sync_signals(source_provider);
create index if not exists sync_signals_occurred_at_idx on sync_signals(occurred_at desc);

-- meeting_sync_links: one canonical meeting ← many calendar signals
create table if not exists meeting_sync_links (
  id         uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  signal_id  uuid not null references sync_signals(id) on delete cascade,
  is_primary boolean not null default false,  -- true for the highest-priority source (admin > support > personal)
  created_at timestamptz not null default now(),
  unique (meeting_id, signal_id)
);

create index if not exists meeting_sync_links_meeting_id_idx on meeting_sync_links(meeting_id);
create index if not exists meeting_sync_links_signal_id_idx  on meeting_sync_links(signal_id);

-- updated_at trigger for sync_signals
drop trigger if exists set_sync_signals_updated_at on sync_signals;
create trigger set_sync_signals_updated_at
  before update on sync_signals
  for each row execute function update_updated_at();

-- RLS: internal users only
alter table sync_signals     enable row level security;
alter table meeting_sync_links enable row level security;

create policy "Internal users full access to sync_signals"
  on sync_signals for all
  using (is_internal_user());

create policy "Internal users full access to meeting_sync_links"
  on meeting_sync_links for all
  using (is_internal_user());
