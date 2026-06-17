# Radar — Open Items

## Phase 2 Planned (not built)

| Item | Notes |
|------|-------|
| RSS ingestion | n8n workflow or Edge Function to poll `radar_sources` with `rss_url` and auto-insert radar_items |
| Bulk import | CSV upload for event lists |
| Duplicate detection | Use `duplicate_key` or `canonical_url` partial unique indexes (already in schema) |
| Signal editing | Edit title/summary/category on detail page |
| Radar source edit/deactivate UI | Currently admin can only create sources from `/sources/new`; no edit page |
| Scheduled content | Wire `scheduled_for` on `radar_content_ideas`; integrate with meetings/calendar |
| Team assignment | `assigned_to` field on `radar_items` is in schema but no UI |
| Admin source management | Deactivate/priority bump buttons on sources list |

## Known Limitations (Phase 1)

- No RSS polling — all signals are manual URL captures
- No auto-publish — drafts must be approved and published manually outside the app
- AI classification runs synchronously in the server action (may add latency on slow Together AI responses)
- `radar_actions` can be created via server action but there is no UI for creating them from the detail page — they show as read-only in the logged actions section
- LinkedIn/Instagram/X scraping is explicitly excluded for compliance and platform TOS reasons

## Migration Status

Migration 020 must be applied manually via Supabase SQL editor — there is no CLI link.  
Run `pnpm check:migrations` to confirm remote schema is in sync.
