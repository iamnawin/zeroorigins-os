import 'server-only'

import { callTogetherChat, parseJsonObject } from '@/lib/ai/together-client'
import type { RadarItem, RadarItemCategory, RadarActionType } from '@/types'
import { clampScore } from './scoring'
import {
  buildClassifyPrompt,
  buildLinkedInDraftPrompt,
  buildInstagramCaptionPrompt,
  buildXDraftPrompt,
  buildCarouselOutlinePrompt,
} from './prompts'

export interface RadarClassification {
  category: RadarItemCategory
  tags: string[]
  business_vertical: string
  ai_summary: string
  why_it_matters: string
  recommended_action: RadarActionType
  linkedin_angle: string | null
  instagram_angle: string | null
  x_angle: string | null
  relevance_score: number
  urgency_score: number
  content_potential_score: number
  business_value_score: number
  is_placeholder: boolean
  placeholder_reason?: string
}

export interface RadarDraftResult {
  hook?: string
  draft_body: string
  caption?: string
  hashtags: string[]
  call_to_action?: string
  is_placeholder: boolean
  placeholder_reason?: string
}

export interface RadarCarouselResult {
  slides: Array<{ slide: number; title: string; bullets: string[] }>
  hashtags: string[]
  is_placeholder: boolean
  placeholder_reason?: string
}

const PLACEHOLDER_CLASSIFICATION: RadarClassification = {
  category: 'ai_news',
  tags: [],
  business_vertical: 'General',
  ai_summary: '[AI classification unavailable — review manually]',
  why_it_matters: '[AI classification unavailable — review manually]',
  recommended_action: 'read',
  linkedin_angle: null,
  instagram_angle: null,
  x_angle: null,
  relevance_score: 0,
  urgency_score: 0,
  content_potential_score: 0,
  business_value_score: 0,
  is_placeholder: true,
  placeholder_reason: 'AI classification failed or TOGETHER_API_KEY not configured.',
}

export async function classifyRadarItem(input: {
  title: string
  summary?: string
  url?: string
  source_name?: string
}): Promise<RadarClassification> {
  try {
    const result = await callTogetherChat({
      task: 'radar_classify',
      messages: [{ role: 'user', content: buildClassifyPrompt(input) }],
      maxTokens: 600,
    })

    const raw = parseJsonObject<Record<string, unknown>>(result.content)

    return {
      category: (raw.category as RadarItemCategory) ?? 'ai_news',
      tags: Array.isArray(raw.tags) ? (raw.tags as string[]).slice(0, 5) : [],
      business_vertical: (raw.business_vertical as string) ?? 'General',
      ai_summary: (raw.ai_summary as string) ?? '',
      why_it_matters: (raw.why_it_matters as string) ?? '',
      recommended_action: (raw.recommended_action as RadarActionType) ?? 'read',
      linkedin_angle: (raw.linkedin_angle as string | null) ?? null,
      instagram_angle: (raw.instagram_angle as string | null) ?? null,
      x_angle: (raw.x_angle as string | null) ?? null,
      relevance_score: clampScore(raw.relevance_score),
      urgency_score: clampScore(raw.urgency_score),
      content_potential_score: clampScore(raw.content_potential_score),
      business_value_score: clampScore(raw.business_value_score),
      is_placeholder: false,
    }
  } catch {
    return { ...PLACEHOLDER_CLASSIFICATION }
  }
}

export async function generateLinkedInDraft(item: RadarItem): Promise<RadarDraftResult> {
  try {
    const result = await callTogetherChat({
      task: 'radar_linkedin_draft',
      messages: [{ role: 'user', content: buildLinkedInDraftPrompt(item) }],
      maxTokens: 500,
      temperature: 0.7,
    })

    const raw = parseJsonObject<Record<string, unknown>>(result.content)

    return {
      hook: (raw.hook as string) ?? undefined,
      draft_body: (raw.draft_body as string) ?? '',
      hashtags: Array.isArray(raw.hashtags) ? (raw.hashtags as string[]) : [],
      call_to_action: (raw.call_to_action as string) ?? undefined,
      is_placeholder: false,
    }
  } catch {
    return {
      draft_body: '[AI draft generation unavailable — placeholder]',
      hashtags: [],
      is_placeholder: true,
      placeholder_reason: 'LinkedIn draft generation failed.',
    }
  }
}

export async function generateInstagramCaption(item: RadarItem): Promise<RadarDraftResult> {
  try {
    const result = await callTogetherChat({
      task: 'radar_instagram_caption',
      messages: [{ role: 'user', content: buildInstagramCaptionPrompt(item) }],
      maxTokens: 300,
      temperature: 0.7,
    })

    const raw = parseJsonObject<Record<string, unknown>>(result.content)

    return {
      hook: (raw.hook as string) ?? undefined,
      draft_body: (raw.caption as string) ?? '',
      hashtags: Array.isArray(raw.hashtags) ? (raw.hashtags as string[]) : [],
      is_placeholder: false,
    }
  } catch {
    return {
      draft_body: '[AI draft generation unavailable — placeholder]',
      hashtags: [],
      is_placeholder: true,
      placeholder_reason: 'Instagram caption generation failed.',
    }
  }
}

export async function generateXDraft(item: RadarItem): Promise<RadarDraftResult> {
  try {
    const result = await callTogetherChat({
      task: 'radar_x_draft',
      messages: [{ role: 'user', content: buildXDraftPrompt(item) }],
      maxTokens: 150,
      temperature: 0.7,
    })

    const raw = parseJsonObject<Record<string, unknown>>(result.content)

    return {
      draft_body: (raw.draft_body as string) ?? '',
      hashtags: Array.isArray(raw.hashtags) ? (raw.hashtags as string[]) : [],
      is_placeholder: false,
    }
  } catch {
    return {
      draft_body: '[AI draft generation unavailable — placeholder]',
      hashtags: [],
      is_placeholder: true,
      placeholder_reason: 'X draft generation failed.',
    }
  }
}

export async function generateCarouselOutline(item: RadarItem): Promise<RadarCarouselResult> {
  try {
    const result = await callTogetherChat({
      task: 'radar_carousel_outline',
      messages: [{ role: 'user', content: buildCarouselOutlinePrompt(item) }],
      maxTokens: 700,
      temperature: 0.6,
    })

    const raw = parseJsonObject<Record<string, unknown>>(result.content)

    return {
      slides: Array.isArray(raw.slides)
        ? (raw.slides as Array<{ slide: number; title: string; bullets: string[] }>)
        : [],
      hashtags: Array.isArray(raw.hashtags) ? (raw.hashtags as string[]) : [],
      is_placeholder: false,
    }
  } catch {
    return {
      slides: [],
      hashtags: [],
      is_placeholder: true,
      placeholder_reason: 'Carousel outline generation failed.',
    }
  }
}
