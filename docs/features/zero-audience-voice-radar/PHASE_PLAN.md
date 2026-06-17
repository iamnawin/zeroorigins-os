# Zero Audience Voice — Intelligence Radar: Phase Plan & Spec

Internal codename: Intelligence Radar / Signal Radar / Radar Inbox / Intelligence Room.

This document is the authoritative spec for the feature, persisted before implementation per project convention (spec-first, then build). It is the source of truth other docs in this folder (`ARCHITECTURE.md`, `DATABASE.md`, `UI_FLOW.md`, `AI_PROMPTS.md`, `SOURCE_STRATEGY.md`, `CHANGELOG.md`, `DEPLOYMENT_NOTES.md`, `OPEN_ITEMS.md`) expand on.

## Product goal

An in-app radar that continuously collects, classifies, summarizes, scores, and converts market signals into content ideas, event opportunities, tasks, and CRM actions.

Signal domains: AI news/tools/models/events, local Hyderabad/India tech events, Salesforce/Agentforce/CRM AI updates, automation tools, n8n/MCP/local-LLM updates, startup news, competitor/influencer topics, content opportunities.

Flow: **Signal → Summary → Relevance Score → Content Angle → Draft → Approval → Schedule/Publish later.**

## Hard constraints (must hold throughout all phases)

- Do NOT rebuild the app from scratch.
- Do NOT break existing auth, Supabase, RLS, AI backend, chatbot, agent workflows, routes, public forms, internal pages, drag/drop board, sync features, or current UI.
- Do NOT rename existing tables unless absolutely required.
- Do NOT delete existing modules.
- Do NOT introduce a heavy new architecture without explaining why — reuse Resource Kit, Server Actions, `is_internal_user()` RLS helper, `activity_logs`, Together AI backend.
- Do NOT auto-post to LinkedIn, Instagram, or X in Phase 1.
- Do NOT scrape LinkedIn directly; do NOT build unsafe social automation.
- Do NOT store API keys in code; do NOT expose raw source data publicly; do NOT bypass RLS; do NOT make public routes for radar data; do NOT create background jobs unless the app already safely supports them.
- Phase 1 must be human-in-the-loop — AI can generate drafts but must NOT publish automatically.
- Never claim deployment succeeded unless actually deployed.

## Phase 1 — scope (this build)

1. Radar Sources (registry of where signals come from)
2. Radar Items/Signals (the captured signal records)
3. Manual URL capture ("Add Signal")
4. AI-ready classification fields (category, tags, scores, summary, angles)
5. Event tracking fields (date/time, location, mode, organizer, registration)
6. Content idea generation fields (linked draft records)
7. Internal Radar Dashboard UI (`/internal/radar`)
8. Radar Item Detail UI (`/internal/radar/[id]`)
9. Create LinkedIn Draft button
10. Create Instagram Caption button
11. Create X/Twitter Draft button
12. Save to Content Calendar/Content Ideas
13. Status workflow (lifecycle, no hard delete)
14. Documentation files (this folder)
15. Changelog updates
16. Vercel/deployment notes document

**Explicitly excluded from Phase 1:** real social auto-publishing, LinkedIn scraping, unsafe automation, RSS ingestion automation, background jobs.

## Data model summary

Four new tables: `radar_sources`, `radar_items`, `radar_content_ideas`, `radar_actions`. Full column-level definitions live in `DATABASE.md` and migration `supabase/migrations/020_radar_intelligence.sql`.

- **Source types:** rss, website, event_platform, newsletter, manual_url, github, youtube, linkedin_manual, x_manual, salesforce_news, other.
- **Signal categories:** ai_news, ai_model_update, ai_tool_update, ai_agent_workflow, salesforce_ai, salesforce_crm, crm_automation, startup_news, india_ai, local_event, global_event, webinar, workshop, conference, hackathon, funding, competitor_signal, creator_trend, content_opportunity, product_idea, ignore.
- **Business verticals (free text per item, not FK):** ZeroOrigins CRM Systems, ZeroOrigins AI Systems, ZeroOrigins Media Lab, ZeroOrigins Academy, Zero Audience Voice, IgnAIte, General.
- **Item status workflow:** new → reviewed → saved/ignored → content_idea/draft_created/event_interested/event_registered/attended/task_created → archived.
- **Content idea status workflow:** idea → draft → needs_review → approved → rejected/scheduled → published/archived.
- **Action status:** open → in_progress → done/cancelled/archived.

RLS: enable on all four tables; only authenticated internal users read; admins manage sources fully; admins+employees create/update items and content ideas; no public anonymous access; no raw content exposed publicly; reuse `is_internal_user()` — no new role system.

## UI routes

- `/internal/radar` — dashboard
- `/internal/radar/sources` — source management
- `/internal/radar/events` — event-focused view
- `/internal/radar/content-ideas` — draft list
- `/internal/radar/[id]` — item detail

Navigation: add "Radar" entry to `INTERNAL_NAV_GROUPS` in `src/lib/internal-navigation.ts`.

## UI design direction

Premium AI intelligence cockpit: dark background, glass panels, subtle borders, silver/white text, amber/gold or violet accents matching existing `zo-purple` theme. Clean cards, small status badges, strong hierarchy, agent-like briefing area. No cartoonish/emoji-heavy/generic pastel look.

## Page specs

### `/internal/radar` (dashboard)

- Hero: title "Intelligence Radar", subtitle "AI, Salesforce, events, tools, and market signals worth acting on.", summary placeholder "Here are the signals worth your attention today.", counts (New signals / High relevance / Upcoming events / Draft opportunities), CTAs (Add Signal / Add Source / View Events / View Content Ideas).
- Filters: search, category, status, source type, business vertical, event mode, location, date range, score threshold.
- Item cards: title, source, date, category badge, tags, AI summary, why it matters, relevance score, content potential score, event date/location, recommended action. Buttons: View / Save / Ignore / Create LinkedIn Draft / Create Instagram Caption / Create X Draft / Create Action / Mark Event Interested.
- Optional secondary panel: Top events this week, Best content opportunities, Salesforce/CRM watch, AI tools to test, Saved manual links.
- Empty state: "Your radar is quiet. Add a source, capture a link, or start tracking AI and Salesforce signals."

### `/internal/radar/[id]` (detail)

Full detail + actions: Create LinkedIn Draft / Instagram Caption / X Draft / Carousel Outline, Create Task/Action, Mark Ignored/Reviewed, Archive.

### `/internal/radar/sources`

Management UI + seed list (see `SOURCE_STRATEGY.md` for the full seeded source list). Actions: Add/Edit/Disable source, Test source (placeholder), Last checked timestamp.

### `/internal/radar/events`

Event cards/table + score explanation placeholder (topic match, location match, speaker/organizer quality, networking value, business value, content value). Actions: Interested / Registered / Attended / Ignore / Create content idea / Create task.

### `/internal/radar/content-ideas`

Draft list + actions: Edit / Approve / Reject / Archive / Copy / Mark posted manually / Add published URL. No auto-publish.

### "Add Signal" modal

Built with the existing `Dialog` primitive (`src/components/ui/dialog.tsx`). Fields: URL, title (optional), source name (optional), source type, category, tags, notes/raw content, business vertical, event date/time (optional), location (optional). On submit: insert `radar_items` row with `status='new'`; fallback title=URL if missing; no scraping dependency.

## AI classification & draft generation

Reuses the existing Together AI backend (`TOGETHER_API_KEY`, real client at `src/lib/ai/together-client.ts`) — not a stub. New functions in `src/lib/radar/ai.ts`: `classifyRadarItem()`, `generateRadarSummary()`, `scoreRadarItem()`, `generateLinkedInDraft()`, `generateInstagramCaption()`, `generateXDraft()`, `generateCarouselOutline()`.

Classifier JSON shape (scores 0–10):

```json
{
  "category": "ai_news",
  "tags": ["AI agents", "Salesforce", "automation"],
  "business_vertical": "ZeroOrigins AI Systems",
  "summary": "",
  "why_it_matters": "",
  "relevance_score": 1,
  "urgency_score": 1,
  "content_potential_score": 1,
  "business_value_score": 1,
  "recommended_action": "create_post",
  "linkedin_angle": "",
  "instagram_angle": "",
  "x_angle": ""
}
```

If AI fails or `TOGETHER_API_KEY` is unavailable: manual save must still work; any draft output must be clearly labeled placeholder — never presented as final AI output.

## Brand voice (for generated drafts)

Practical, sharp, founder/operator, AI-builder perspective; business+technical balance; direct not arrogant; no cringe. Avoid hype, fake urgency, copied summaries, emoji spam, hashtag overload. Prefer why-it-matters, builder angle, business angle, Salesforce/CRM angle, India/local context, ZeroOrigins POV.

- **LinkedIn:** hook, context, opinion/insight, practical takeaway, question/CTA, 3–6 hashtags max. Ideally 3 angles (Educational / Opinion / Builder-practical) — one solid draft is acceptable for Phase 1.
- **Instagram:** hook, simple explanation, creator/business angle, CTA, hashtags. Optional carousel outline (6 slides: hook → context → why it matters → practical use → ZeroOrigins angle → CTA).
- **X:** concise, direct, opinionated, short-form. No thread automation unless easy.

Full prompt templates live in `AI_PROMPTS.md`.

## Activity logging

Hooks into the existing `activity_logs` table for: source created, item added, item reviewed, item ignored, content idea created, event marked interested, action created — mirroring the `logLifecycleActivity` pattern in `src/lib/actions/lifecycle-board.ts`.

## Phase roadmap

- **Phase 1 (this build):** Internal inbox, manual capture, source registry, draft records, no auto-post.
- **Phase 2:** RSS/newsletter ingestion, daily digest, n8n integration, automated AI classification on ingest.
- **Phase 3:** Approval workflow, content calendar, Instagram/LinkedIn/X API publishing (if approved by the user at that time).
- **Phase 4:** CRM/content performance loop, lead-campaign connection, topic analytics, competitor intelligence.

## Definition of done (Phase 1)

- New radar tables exist with RLS.
- Internal Radar page loads.
- Sources page works.
- Add Signal works.
- Radar items list works.
- Radar detail page works.
- Events view works.
- Content Ideas view works.
- Draft records creatable from items.
- No automatic publishing.
- Navigation includes Radar.
- All docs exist.
- `CLAUDE.md` updated.
- `CHANGELOG.md` updated.
- `DEPLOYMENT_NOTES.md` updated.
- Lint passes.
- Build passes.
- Final report provided.
