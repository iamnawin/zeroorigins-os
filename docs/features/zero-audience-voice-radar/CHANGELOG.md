# Radar — Changelog

## Phase 1 — Initial Implementation (2026-06-17)

### Added

- `supabase/migrations/020_radar_intelligence.sql` — 4 new tables, RLS, 18 seed sources
- `scripts/lib/migration-sentinels.mjs` — 4 new sentinel entries for migration 020
- `src/types/index.ts` — Radar type constants and interfaces (RadarSource, RadarItem, RadarContentIdea, RadarAction)
- `src/lib/ai/model-router.ts` — 5 radar AI tasks (classify, linkedin, instagram, x, carousel)
- `src/lib/radar/scoring.ts` — clampScore, scoreTier, isHighRelevance
- `src/lib/radar/prompts.ts` — prompt builders for all 5 AI tasks
- `src/lib/radar/ai.ts` — Together AI wrappers with placeholder fallback
- `src/lib/radar/queries.ts` — server-only read helpers
- `src/lib/radar/actions.ts` — server actions (captureManualSignal, classifyRadarItemWithAi, createContentDraft, etc.)
- `src/components/radar/radar-score-badge.tsx`
- `src/components/radar/radar-item-card.tsx`
- `src/components/radar/add-signal-dialog.tsx`
- `src/components/radar/radar-item-actions.tsx`
- `src/components/radar/content-idea-card.tsx`
- `src/app/(internal)/internal/radar/page.tsx` — dashboard
- `src/app/(internal)/internal/radar/[id]/page.tsx` — detail
- `src/app/(internal)/internal/radar/sources/page.tsx`
- `src/app/(internal)/internal/radar/sources/new/page.tsx`
- `src/app/(internal)/internal/radar/events/page.tsx`
- `src/app/(internal)/internal/radar/content-ideas/page.tsx`
- `src/lib/internal-navigation.ts` — Radar added to primary nav group
- `docs/features/zero-audience-voice-radar/` — PHASE_PLAN.md, README.md, ARCHITECTURE.md, DATABASE.md, AI_PROMPTS.md, OPEN_ITEMS.md, CHANGELOG.md
