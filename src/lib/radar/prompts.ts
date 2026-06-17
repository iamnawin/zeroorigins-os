import type { RadarItem } from '@/types'

const BRAND_VOICE = `You are writing for ZeroOrigins AI — a boutique AI services studio based in India.
Brand voice: sharp, credible, practitioner-first. No hype. No buzzwords. Speak to founders, CTOs, and AI-curious professionals.
Always write in first person (the company voice) unless explicitly told otherwise.`

export function buildClassifyPrompt(item: { title: string; summary?: string; url?: string; source_name?: string }): string {
  return `${BRAND_VOICE}

Classify this market signal and return a JSON object only — no prose, no markdown fence.

Signal:
Title: ${item.title}
${item.summary ? `Summary: ${item.summary}` : ''}
${item.url ? `URL: ${item.url}` : ''}
${item.source_name ? `Source: ${item.source_name}` : ''}

Return this exact JSON shape:
{
  "category": one of [ai_news, ai_model_update, ai_tool_update, ai_agent_workflow, salesforce_ai, salesforce_crm, crm_automation, startup_news, india_ai, local_event, global_event, webinar, workshop, conference, hackathon, funding, competitor_signal, creator_trend, content_opportunity, product_idea, ignore],
  "tags": [up to 5 lowercase strings],
  "business_vertical": one of [ZeroOrigins CRM Systems, ZeroOrigins AI Systems, ZeroOrigins Media Lab, ZeroOrigins Academy, Zero Audience Voice, IgnAIte, General],
  "relevance_score": integer 0-10,
  "urgency_score": integer 0-10,
  "content_potential_score": integer 0-10,
  "business_value_score": integer 0-10,
  "ai_summary": "1-2 sentence plain-English summary of what this signal means",
  "why_it_matters": "1 sentence: why this matters to a boutique AI studio in India",
  "recommended_action": one of [read, attend_event, register_event, create_post, create_carousel, test_tool, research_more, share_team, create_demo, create_campaign, create_task, ignore],
  "linkedin_angle": "1 sentence: content angle for LinkedIn if applicable, or null",
  "instagram_angle": "1 sentence: content angle for Instagram if applicable, or null",
  "x_angle": "1 sentence: short take for X if applicable, or null"
}`
}

export function buildLinkedInDraftPrompt(item: RadarItem): string {
  return `${BRAND_VOICE}

Write a LinkedIn post about this market signal. Return JSON only.

Signal: ${item.title}
${item.ai_summary ? `Context: ${item.ai_summary}` : ''}
${item.why_it_matters ? `Why it matters: ${item.why_it_matters}` : ''}
${item.linkedin_angle ? `Angle: ${item.linkedin_angle}` : ''}

Requirements:
- 150-250 words
- Hook in first line (no "I" opener)
- Practitioner insight, not cheerleading
- End with a question or call to reflection
- 3-5 relevant hashtags

Return:
{
  "hook": "first line / headline",
  "draft_body": "full post text",
  "hashtags": ["tag1", "tag2"],
  "call_to_action": "optional CTA line"
}`
}

export function buildInstagramCaptionPrompt(item: RadarItem): string {
  return `${BRAND_VOICE}

Write an Instagram caption about this market signal. Return JSON only.

Signal: ${item.title}
${item.ai_summary ? `Context: ${item.ai_summary}` : ''}
${item.instagram_angle ? `Angle: ${item.instagram_angle}` : ''}

Requirements:
- 80-120 words
- Conversational but credible tone
- Emoji sparingly (1-2 max)
- 5-8 hashtags
- Hook in first line

Return:
{
  "hook": "first line",
  "caption": "full caption text",
  "hashtags": ["tag1", "tag2"]
}`
}

export function buildXDraftPrompt(item: RadarItem): string {
  return `${BRAND_VOICE}

Write an X (Twitter) post about this market signal. Return JSON only.

Signal: ${item.title}
${item.ai_summary ? `Context: ${item.ai_summary}` : ''}
${item.x_angle ? `Angle: ${item.x_angle}` : ''}

Requirements:
- Max 280 characters
- Punchy, no fluff
- 1-2 hashtags max

Return:
{
  "draft_body": "the tweet text including hashtags",
  "hashtags": ["tag1"]
}`
}

export function buildCarouselOutlinePrompt(item: RadarItem): string {
  return `${BRAND_VOICE}

Create a 6-slide LinkedIn carousel outline about this market signal. Return JSON only.

Signal: ${item.title}
${item.ai_summary ? `Context: ${item.ai_summary}` : ''}
${item.why_it_matters ? `Why it matters: ${item.why_it_matters}` : ''}

Requirements:
- Slide 1: Hook / attention-grabbing title
- Slides 2-5: Key insight, data point, or takeaway per slide (short)
- Slide 6: Actionable takeaway + CTA
- Each slide: title + 2-3 bullet points

Return:
{
  "slides": [
    {"slide": 1, "title": "...", "bullets": ["...", "..."]},
    {"slide": 2, "title": "...", "bullets": ["...", "..."]},
    {"slide": 3, "title": "...", "bullets": ["...", "..."]},
    {"slide": 4, "title": "...", "bullets": ["...", "..."]},
    {"slide": 5, "title": "...", "bullets": ["...", "..."]},
    {"slide": 6, "title": "...", "bullets": ["...", "..."]}
  ],
  "hashtags": ["tag1", "tag2", "tag3"]
}`
}
