# Zero Audience Voice — Intelligence Radar

**Phase 1 — Signal Intelligence Hub**

An internal market intelligence module for ZeroOrigins AI. Captures, classifies, scores, and converts market signals into human-reviewed content drafts, event tracking, and action items.

## Purpose

Track what matters — AI news, Salesforce updates, India startup signals, events, competitor moves — and turn the most relevant signals into LinkedIn posts, Instagram captions, X threads, or carousel outlines in one click.

## Phase 1 Scope

- Manual signal capture (URL + title + summary)
- AI classification (category, tags, 4 scores, content angles) via Together AI
- Content draft generation: LinkedIn, Instagram, X, Carousel
- Event tracking (upcoming vs past)
- Signal source registry (admin-managed)
- Human-in-the-loop throughout — no auto-publishing

## Routes

| Route | Description |
|-------|-------------|
| `/internal/radar` | Signal dashboard — filtered card grid with stats |
| `/internal/radar/[id]` | Signal detail, actions, AI classification |
| `/internal/radar/sources` | Source registry list |
| `/internal/radar/sources/new` | Add new source (admin) |
| `/internal/radar/events` | Upcoming events from signals |
| `/internal/radar/content-ideas` | All content drafts |

## Navigation

Added to `primary` group in `INTERNAL_NAV_GROUPS` with `icon: 'Radar'`.

## RSS Ingest (Phase 2)

Hourly Vercel cron at `GET /api/radar/ingest`. Deduplicates by normalized `canonical_url` (tracking params stripped). Per-item and per-source failures are isolated — one bad feed or item does not stop the run.

### Required env vars

| Var | Required | Purpose |
|-----|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Service-role client used by the ingest pipeline (bypasses RLS) |
| `CRON_SECRET` | **Yes** | Protects the ingest endpoint — Vercel sends it automatically |
| `TOGETHER_API_KEY` | Yes | AI classification. Without it, items are inserted without category/scores |

### Manual test

```bash
# Expected 401 — no token
curl https://your-app.vercel.app/api/radar/ingest

# Expected 200 with ingest summary
curl -H "Authorization: Bearer <CRON_SECRET>" https://your-app.vercel.app/api/radar/ingest
```

## See Also

- [PHASE_PLAN.md](./PHASE_PLAN.md) — full spec and phase roadmap
- [ARCHITECTURE.md](./ARCHITECTURE.md) — technical design
- [DATABASE.md](./DATABASE.md) — schema reference
