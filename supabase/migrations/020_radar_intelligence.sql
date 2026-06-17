-- Zero Audience Voice — Intelligence Radar (Phase 1)
-- Adds radar_sources, radar_items, radar_content_ideas, radar_actions.
-- No existing tables are altered, renamed, or dropped.

create table if not exists radar_sources (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  source_type text not null
    check (source_type in (
      'rss', 'website', 'event_platform', 'newsletter', 'manual_url', 'github',
      'youtube', 'linkedin_manual', 'x_manual', 'salesforce_news', 'other'
    )),
  category text,
  url text,
  rss_url text,
  platform text,
  country text,
  city text,
  priority integer not null default 100,
  trust_level text not null default 'medium'
    check (trust_level in ('high', 'medium', 'low', 'unknown')),
  is_active boolean not null default true,
  last_checked_at timestamptz,
  notes text,

  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists radar_sources_name_uidx on radar_sources(name);
create index if not exists radar_sources_is_active_idx on radar_sources(is_active);
create index if not exists radar_sources_source_type_idx on radar_sources(source_type);

create table if not exists radar_items (
  id uuid primary key default gen_random_uuid(),

  source_id uuid references radar_sources(id) on delete set null,

  title text not null,
  summary text,
  raw_content text,
  url text,
  canonical_url text,
  source_name text,
  source_type text,
  published_at timestamptz,
  captured_at timestamptz not null default now(),

  category text
    check (category is null or category in (
      'ai_news', 'ai_model_update', 'ai_tool_update', 'ai_agent_workflow',
      'salesforce_ai', 'salesforce_crm', 'crm_automation', 'startup_news',
      'india_ai', 'local_event', 'global_event', 'webinar', 'workshop',
      'conference', 'hackathon', 'funding', 'competitor_signal',
      'creator_trend', 'content_opportunity', 'product_idea', 'ignore'
    )),
  tags text[] not null default '{}',
  business_vertical text,

  location_city text,
  location_country text,
  event_start_time timestamptz,
  event_end_time timestamptz,
  event_mode text
    check (event_mode is null or event_mode in ('online', 'offline', 'hybrid', 'unknown')),
  event_organizer text,
  registration_url text,

  relevance_score integer not null default 0,
  urgency_score integer not null default 0,
  content_potential_score integer not null default 0,
  business_value_score integer not null default 0,

  ai_summary text,
  why_it_matters text,
  recommended_action text,
  linkedin_angle text,
  instagram_angle text,
  x_angle text,

  status text not null default 'new'
    check (status in (
      'new', 'reviewed', 'saved', 'ignored', 'content_idea', 'draft_created',
      'event_interested', 'event_registered', 'attended', 'task_created', 'archived'
    )),
  duplicate_key text,

  created_by uuid references profiles(id) on delete set null,
  assigned_to uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists radar_items_category_idx on radar_items(category);
create index if not exists radar_items_status_idx on radar_items(status);
create index if not exists radar_items_published_at_idx on radar_items(published_at desc);
create index if not exists radar_items_captured_at_idx on radar_items(captured_at desc);
create index if not exists radar_items_business_vertical_idx on radar_items(business_vertical);
create index if not exists radar_items_event_start_time_idx on radar_items(event_start_time);
create index if not exists radar_items_duplicate_key_idx on radar_items(duplicate_key);
create index if not exists radar_items_source_id_idx on radar_items(source_id);

-- Duplicate protection: a canonical_url or duplicate_key, when present, must be unique.
create unique index if not exists radar_items_canonical_url_uidx
  on radar_items(canonical_url) where canonical_url is not null;
create unique index if not exists radar_items_duplicate_key_uidx
  on radar_items(duplicate_key) where duplicate_key is not null;

create table if not exists radar_content_ideas (
  id uuid primary key default gen_random_uuid(),

  radar_item_id uuid references radar_items(id) on delete set null,

  platform text not null
    check (platform in ('linkedin', 'instagram', 'x', 'youtube', 'blog', 'newsletter')),
  content_type text not null
    check (content_type in (
      'text_post', 'short_post', 'carousel', 'reel_script',
      'video_script', 'newsletter_note', 'blog_outline'
    )),

  post_angle text,
  hook text,
  draft_body text,
  caption text,
  carousel_outline jsonb,
  hashtags text[] not null default '{}',
  call_to_action text,
  brand_voice text,

  status text not null default 'idea'
    check (status in (
      'idea', 'draft', 'needs_review', 'approved', 'rejected',
      'scheduled', 'published', 'archived'
    )),
  scheduled_for timestamptz,
  published_at timestamptz,
  published_url text,
  notes text,

  created_by uuid references profiles(id) on delete set null,
  approved_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists radar_content_ideas_radar_item_id_idx on radar_content_ideas(radar_item_id);
create index if not exists radar_content_ideas_platform_idx on radar_content_ideas(platform);
create index if not exists radar_content_ideas_status_idx on radar_content_ideas(status);

create table if not exists radar_actions (
  id uuid primary key default gen_random_uuid(),

  radar_item_id uuid references radar_items(id) on delete set null,

  action_type text not null
    check (action_type in (
      'read', 'attend_event', 'register_event', 'create_post', 'create_carousel',
      'test_tool', 'research_more', 'share_team', 'create_demo', 'create_campaign', 'create_task'
    )),
  title text not null,
  description text,
  owner_id uuid references profiles(id) on delete set null,
  due_date timestamptz,

  status text not null default 'open'
    check (status in ('open', 'in_progress', 'done', 'cancelled', 'archived')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),

  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists radar_actions_radar_item_id_idx on radar_actions(radar_item_id);
create index if not exists radar_actions_status_idx on radar_actions(status);
create index if not exists radar_actions_owner_id_idx on radar_actions(owner_id);

-- updated_at triggers (reuses the shared update_updated_at() function from migration 019)
drop trigger if exists set_radar_sources_updated_at on radar_sources;
create trigger set_radar_sources_updated_at
  before update on radar_sources
  for each row execute function update_updated_at();

drop trigger if exists set_radar_items_updated_at on radar_items;
create trigger set_radar_items_updated_at
  before update on radar_items
  for each row execute function update_updated_at();

drop trigger if exists set_radar_content_ideas_updated_at on radar_content_ideas;
create trigger set_radar_content_ideas_updated_at
  before update on radar_content_ideas
  for each row execute function update_updated_at();

drop trigger if exists set_radar_actions_updated_at on radar_actions;
create trigger set_radar_actions_updated_at
  before update on radar_actions
  for each row execute function update_updated_at();

-- RLS: internal users only, no public/anonymous access.
alter table radar_sources enable row level security;
alter table radar_items enable row level security;
alter table radar_content_ideas enable row level security;
alter table radar_actions enable row level security;

drop policy if exists "Internal users can view radar sources" on radar_sources;
create policy "Internal users can view radar sources"
  on radar_sources for select
  using (is_internal_user());

drop policy if exists "Admins manage radar sources" on radar_sources;
create policy "Admins manage radar sources"
  on radar_sources for all
  using (get_user_role() = 'admin')
  with check (get_user_role() = 'admin');

drop policy if exists "Internal users manage radar items" on radar_items;
create policy "Internal users manage radar items"
  on radar_items for all
  using (is_internal_user())
  with check (is_internal_user());

drop policy if exists "Internal users manage radar content ideas" on radar_content_ideas;
create policy "Internal users manage radar content ideas"
  on radar_content_ideas for all
  using (is_internal_user())
  with check (is_internal_user());

drop policy if exists "Internal users manage radar actions" on radar_actions;
create policy "Internal users manage radar actions"
  on radar_actions for all
  using (is_internal_user())
  with check (is_internal_user());

-- Seed sources (Phase 1 starting list — manageable from /internal/radar/sources)
insert into radar_sources (name, source_type, category, url, country, city, trust_level, notes)
values
  ('OpenAI News', 'website', 'ai_news', 'https://openai.com/news/', null, null, 'high', 'Official OpenAI announcements.'),
  ('Anthropic News', 'website', 'ai_news', 'https://www.anthropic.com/news', null, null, 'high', 'Official Anthropic announcements.'),
  ('Google AI Blog', 'website', 'ai_news', 'https://blog.google/technology/ai/', null, null, 'high', 'Google AI product and research updates.'),
  ('Microsoft AI Blog', 'website', 'ai_news', 'https://blogs.microsoft.com/ai/', null, null, 'high', 'Microsoft AI product updates.'),
  ('Meta AI Blog', 'website', 'ai_news', 'https://ai.meta.com/blog/', null, null, 'high', 'Meta AI research and product updates.'),
  ('Hugging Face Blog', 'website', 'ai_tool_update', 'https://huggingface.co/blog', null, null, 'high', 'Open model and tooling releases.'),
  ('Salesforce News', 'website', 'salesforce_ai', 'https://www.salesforce.com/news/', null, null, 'high', 'Official Salesforce/Agentforce announcements.'),
  ('Salesforce Ben', 'website', 'salesforce_crm', 'https://www.salesforceben.com/', null, null, 'high', 'Independent Salesforce ecosystem commentary.'),
  ('Analytics India Magazine', 'website', 'india_ai', 'https://analyticsindiamag.com/', 'India', null, 'medium', 'India-focused AI industry coverage.'),
  ('Inc42', 'website', 'startup_news', 'https://inc42.com/', 'India', null, 'medium', 'Indian startup news.'),
  ('YourStory', 'website', 'startup_news', 'https://yourstory.com/', 'India', null, 'medium', 'Indian startup news.'),
  ('Nasscom', 'website', 'india_ai', 'https://nasscom.in/', 'India', null, 'medium', 'Indian tech industry body updates.'),
  ('T-Hub', 'website', 'local_event', 'https://t-hub.co/', 'India', 'Hyderabad', 'medium', 'Hyderabad startup hub events.'),
  ('AI Tinkerers Hyderabad', 'event_platform', 'local_event', 'https://www.aitinkerers.org/', 'India', 'Hyderabad', 'medium', 'Local AI builder meetups.'),
  ('Meetup Hyderabad AI', 'event_platform', 'local_event', 'https://www.meetup.com/', 'India', 'Hyderabad', 'medium', 'Hyderabad AI meetup groups.'),
  ('Eventbrite India Tech Events', 'event_platform', 'india_ai', 'https://www.eventbrite.com/', 'India', null, 'medium', 'India tech event listings.'),
  ('GitHub Trending AI', 'github', 'ai_tool_update', 'https://github.com/trending', null, null, 'medium', 'Trending AI repos and tools.'),
  ('Product Hunt AI', 'website', 'ai_tool_update', 'https://www.producthunt.com/', null, null, 'medium', 'New AI product launches.')
on conflict (name) do nothing;
