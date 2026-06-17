# Radar — AI Prompts Reference

All prompts are in `src/lib/radar/prompts.ts`.

## Brand Voice (embedded in all prompts)

```
ZeroOrigins AI — boutique AI services studio based in India.
Voice: sharp, credible, practitioner-first. No hype. No buzzwords.
Audience: founders, CTOs, AI-curious professionals.
Always write in first person (company voice) unless told otherwise.
```

## Classification Prompt

**Function:** `buildClassifyPrompt(input)`  
**Task:** `radar_classify` → `Qwen/Qwen3.5-9B`  
**Max tokens:** 600

Returns structured JSON with:
- `category` (one of 21 RADAR_ITEM_CATEGORIES)
- `tags` (up to 5)
- `business_vertical` (one of 7)
- `ai_summary`, `why_it_matters`
- `recommended_action` (one of 11 RADAR_ACTION_TYPES)
- `linkedin_angle`, `instagram_angle`, `x_angle`
- `relevance_score`, `urgency_score`, `content_potential_score`, `business_value_score` (0–10)

## Content Draft Prompts

| Function | Task | Tokens | Output |
|----------|------|--------|--------|
| `buildLinkedInDraftPrompt` | radar_linkedin_draft | 500 | hook, draft_body (150-250w), hashtags, CTA |
| `buildInstagramCaptionPrompt` | radar_instagram_caption | 300 | hook, caption (80-120w), hashtags |
| `buildXDraftPrompt` | radar_x_draft | 150 | draft_body (≤280 chars), hashtags |
| `buildCarouselOutlinePrompt` | radar_carousel_outline | 700 | 6 slides with title+bullets, hashtags |

## Placeholder Fallback

When AI call fails (network error, missing API key, empty response):
- `classifyRadarItem` returns `PLACEHOLDER_CLASSIFICATION` with `is_placeholder: true`
- Draft generators return `{ draft_body: '[AI draft generation unavailable — placeholder]', is_placeholder: true }`
- Placeholder status is stored in `radar_content_ideas.notes`
- Never shown to user as real AI output
