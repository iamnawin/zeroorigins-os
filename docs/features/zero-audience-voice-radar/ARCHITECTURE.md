# Radar — Architecture

## Layer Map

```
src/lib/radar/
  scoring.ts        pure helpers: clampScore, scoreTier, isHighRelevance
  prompts.ts        prompt builders (brand voice embedded, no secrets)
  ai.ts             Together AI wrappers (server-only) → classifyRadarItem, generateLinkedInDraft, etc.
  queries.ts        server-only read helpers → getRadarItems, getRadarDashboardCounts, etc.
  actions.ts        'use server' mutations → captureManualSignal, createContentDraft, etc.

src/components/radar/
  radar-score-badge.tsx     score + tier color (pure presentational)
  radar-item-card.tsx       signal card for list view (Server-renderable, no interactivity)
  add-signal-dialog.tsx     'use client' dialog → calls captureManualSignal
  radar-item-actions.tsx    'use client' action bar → classify AI, status change, create draft
  content-idea-card.tsx     'use client' draft card → approve/reject/review transitions

src/app/(internal)/internal/radar/
  page.tsx                  dashboard (async Server Component)
  [id]/page.tsx             detail (async Server Component)
  sources/page.tsx          source list (async Server Component)
  sources/new/page.tsx      add source form ('use client')
  events/page.tsx           events view (async Server Component)
  content-ideas/page.tsx    content draft list (async Server Component)
```

## Data Flow

```
User pastes URL
  → AddSignalDialog (client)
  → captureManualSignal (server action)
  → classifyRadarItem (ai.ts → Together AI → Qwen3.5-9B)
  → INSERT radar_items (with AI fields if successful)
  → logRadarActivity → activity_logs
  → revalidatePath('/internal/radar')
  → redirect to /internal/radar/[id]

User clicks "LinkedIn Post" on detail page
  → RadarItemActions (client)
  → createContentDraft (server action)
  → generateLinkedInDraft (ai.ts → Together AI)
  → INSERT radar_content_ideas (draft_body, hashtags, hook)
  → UPDATE radar_items SET status='draft_created'
  → logRadarActivity
  → redirect to /internal/radar/content-ideas
```

## AI Integration

All AI calls go through `src/lib/ai/together-client.ts` (`callTogetherChat`). Radar uses:

| Task | Model | Tokens |
|------|-------|--------|
| radar_classify | Qwen/Qwen3.5-9B | 600 |
| radar_linkedin_draft | Qwen/Qwen3.5-9B | 500 |
| radar_instagram_caption | Qwen/Qwen3.5-9B | 300 |
| radar_x_draft | Qwen/Qwen3.5-9B | 150 |
| radar_carousel_outline | Qwen/Qwen3.5-9B | 700 |

All AI functions catch errors and return `{ is_placeholder: true }` — never throw to the user. Placeholder status is surfaced in the UI and stored in `radar_content_ideas.notes`.

## Security

- All routes under `(internal)` — auth enforced by `proxy.ts`
- All DB operations use server-side Supabase client (cookie-based session)
- RLS on all 4 tables — no direct client browser access to radar data
- `radar_sources` write operations require `admin` role (enforced in `requireAdmin()` + RLS)
- `TOGETHER_API_KEY` accessed only in server-only modules (`ai.ts` imports `server-only`)
- No API keys in code — all via env vars
