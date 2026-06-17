# Radar — Database Reference

Migration: `supabase/migrations/020_radar_intelligence.sql`

## Tables

### `radar_sources`
Signal source registry. Write restricted to `admin` role via RLS.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text UNIQUE | Unique index `radar_sources_name_uidx` |
| source_type | text | check constraint: rss/website/event_platform/newsletter/manual_url/github/youtube/linkedin_manual/x_manual/salesforce_news/other |
| url | text | Homepage URL |
| rss_url | text | Feed URL |
| category | text | Free-form category label |
| country / city | text | Geographic scope |
| priority | int | 1–10, higher = more important |
| trust_level | text | high/medium/low/unknown |
| is_active | bool | Default true; used by Active filter |
| last_checked_at | timestamptz | Set by future ingestion jobs |
| notes | text | |
| created_by | uuid → profiles | |

### `radar_items`
Individual market signals. Core entity.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| source_id | uuid → radar_sources | Nullable (manual signals have none) |
| title | text NOT NULL | |
| summary | text | Raw/human summary |
| raw_content | text | Full scraped content (future) |
| url | text | Original link |
| canonical_url | text | Partial unique index (WHERE NOT NULL) |
| duplicate_key | text | Partial unique index (WHERE NOT NULL) |
| source_name | text | Denormalized for display |
| source_type | text | Denormalized |
| published_at | timestamptz | |
| captured_at | timestamptz NOT NULL | When added to DB |
| category | text | RADAR_ITEM_CATEGORIES check |
| tags | text[] | Max 5 |
| business_vertical | text | |
| location_city/country | text | For events |
| event_start/end_time | timestamptz | For events |
| event_mode | text | online/offline/hybrid/unknown |
| event_organizer | text | |
| registration_url | text | |
| relevance_score | int | 0–10 check |
| urgency_score | int | 0–10 check |
| content_potential_score | int | 0–10 check |
| business_value_score | int | 0–10 check |
| ai_summary | text | AI-generated summary |
| why_it_matters | text | AI explanation |
| recommended_action | text | |
| linkedin/instagram/x_angle | text | AI content angles |
| status | text | RADAR_ITEM_STATUSES check |
| created_by / assigned_to | uuid → profiles | |

### `radar_content_ideas`
AI-generated drafts linked to a signal.

| Column | Type | Notes |
|--------|------|-------|
| platform | text | linkedin/instagram/x/youtube/blog/newsletter |
| content_type | text | text_post/short_post/carousel/etc |
| hook | text | Opening line |
| draft_body | text | Full post copy |
| caption | text | Short caption variant |
| carousel_outline | jsonb | Array of slide objects |
| hashtags | text[] | |
| status | text | idea/draft/needs_review/approved/rejected/scheduled/published/archived |
| approved_by | uuid → profiles | Set on status='approved' |
| published_at | timestamptz | Set on status='published' |
| notes | text | Placeholder warnings stored here |

### `radar_actions`
Logged action items linked to a signal.

| Column | Type | Notes |
|--------|------|-------|
| action_type | text | read/attend_event/create_post/etc |
| title | text NOT NULL | |
| status | text | open/in_progress/done/cancelled/archived |
| priority | text | low/normal/high/urgent |
| owner_id | uuid → profiles | Auto-set to current user |
| due_date | timestamptz | |

## RLS Policies

- `radar_sources`: `SELECT` for `is_internal_user()`; INSERT/UPDATE/DELETE for `get_user_role() = 'admin'`
- `radar_items`, `radar_content_ideas`, `radar_actions`: all operations for `is_internal_user()`

## Sentinels (check-migrations)

```js
{ migration: '020_radar_intelligence', table: 'radar_sources', column: 'trust_level' },
{ migration: '020_radar_intelligence', table: 'radar_items', column: 'status' },
{ migration: '020_radar_intelligence', table: 'radar_content_ideas', column: 'platform' },
{ migration: '020_radar_intelligence', table: 'radar_actions', column: 'action_type' },
```

Run `pnpm check:migrations` after applying 020 to confirm.
