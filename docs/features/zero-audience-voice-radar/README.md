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

## See Also

- [PHASE_PLAN.md](./PHASE_PLAN.md) — full spec and phase roadmap
- [ARCHITECTURE.md](./ARCHITECTURE.md) — technical design
- [DATABASE.md](./DATABASE.md) — schema reference
