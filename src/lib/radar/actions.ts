'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  RadarItemStatus,
  RadarContentPlatform,
  RadarContentType,
  RadarContentStatus,
  RadarActionType,
  RadarActionStatus,
  RadarActionPriority,
  RadarSourceType,
  RadarTrustLevel,
} from '@/types'
import { classifyRadarItem, generateLinkedInDraft, generateInstagramCaption, generateXDraft, generateCarouselOutline } from './ai'

type Supabase = Awaited<ReturnType<typeof createClient>>

type ActionResult = { id?: string; error?: string }

async function requireInternalUser(supabase: Supabase) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('You must be signed in.')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, status')
    .eq('id', user.id)
    .single()
  if (profileError) throw profileError
  if (!profile || !['admin', 'employee'].includes(profile.role) || profile.status !== 'active') {
    throw new Error('Your account does not have access to Radar.')
  }
  return user
}

async function requireAdmin(supabase: Supabase) {
  const user = await requireInternalUser(supabase)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('Admin access required.')
  return user
}

async function logRadarActivity(
  supabase: Supabase,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  })
}

function revalidateRadar() {
  revalidatePath('/internal/radar')
  revalidatePath('/internal/radar/sources')
  revalidatePath('/internal/radar/events')
  revalidatePath('/internal/radar/content-ideas')
}

function toResult(error: unknown): ActionResult {
  if (error instanceof Error) return { error: error.message }
  if (error && typeof error === 'object' && 'message' in error) {
    const typed = error as { message?: string; details?: string; hint?: string }
    return { error: [typed.message, typed.details, typed.hint].filter(Boolean).join(' ') }
  }
  return { error: 'Something went wrong.' }
}

export async function createRadarSource(input: {
  name: string
  source_type: RadarSourceType
  url?: string
  rss_url?: string
  category?: string
  country?: string
  city?: string
  priority?: number
  trust_level?: RadarTrustLevel
  notes?: string
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireAdmin(supabase)

    const { data, error } = await supabase
      .from('radar_sources')
      .insert({
        name: input.name.trim(),
        source_type: input.source_type,
        url: input.url || null,
        rss_url: input.rss_url || null,
        category: input.category || null,
        country: input.country || null,
        city: input.city || null,
        priority: input.priority ?? 5,
        trust_level: input.trust_level ?? 'unknown',
        notes: input.notes || null,
        created_by: user.id,
        is_active: true,
      })
      .select('id')
      .single()
    if (error) throw error

    await logRadarActivity(supabase, user.id, 'Radar source created', 'radar_source', data.id, { name: input.name })
    revalidateRadar()
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateRadarSource(id: string, updates: {
  name?: string
  priority?: number
  trust_level?: RadarTrustLevel
  url?: string
  rss_url?: string
  notes?: string
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireAdmin(supabase)

    const { error } = await supabase
      .from('radar_sources')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    await logRadarActivity(supabase, user.id, 'Radar source updated', 'radar_source', id, updates as Record<string, unknown>)
    revalidateRadar()
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function setRadarSourceActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireAdmin(supabase)

    const { error } = await supabase
      .from('radar_sources')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    await logRadarActivity(supabase, user.id, isActive ? 'Radar source activated' : 'Radar source deactivated', 'radar_source', id)
    revalidateRadar()
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function captureManualSignal(input: {
  title: string
  url: string
  summary?: string
  source_name?: string
  source_id?: string
  published_at?: string
  run_ai?: boolean
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)

    const title = input.title?.trim() || input.url
    let aiFields: Record<string, unknown> = {}

    if (input.run_ai !== false) {
      const classification = await classifyRadarItem({
        title,
        summary: input.summary,
        url: input.url,
        source_name: input.source_name,
      })

      if (!classification.is_placeholder) {
        aiFields = {
          category: classification.category,
          tags: classification.tags,
          business_vertical: classification.business_vertical,
          ai_summary: classification.ai_summary,
          why_it_matters: classification.why_it_matters,
          recommended_action: classification.recommended_action,
          linkedin_angle: classification.linkedin_angle,
          instagram_angle: classification.instagram_angle,
          x_angle: classification.x_angle,
          relevance_score: classification.relevance_score,
          urgency_score: classification.urgency_score,
          content_potential_score: classification.content_potential_score,
          business_value_score: classification.business_value_score,
        }
      }
    }

    const { data, error } = await supabase
      .from('radar_items')
      .insert({
        title,
        url: input.url,
        canonical_url: input.url,
        summary: input.summary || null,
        source_name: input.source_name || 'Manual',
        source_type: 'manual_url',
        source_id: input.source_id || null,
        published_at: input.published_at || null,
        captured_at: new Date().toISOString(),
        status: 'new',
        tags: [],
        relevance_score: 0,
        urgency_score: 0,
        content_potential_score: 0,
        business_value_score: 0,
        created_by: user.id,
        ...aiFields,
      })
      .select('id')
      .single()
    if (error) throw error

    await logRadarActivity(supabase, user.id, 'Manual signal captured', 'radar_item', data.id, {
      title,
      url: input.url,
      ai_classified: !!(aiFields.category),
    })
    revalidateRadar()
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function classifyRadarItemWithAi(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)

    const { data: item, error: fetchError } = await supabase
      .from('radar_items')
      .select('id, title, summary, url, source_name')
      .eq('id', id)
      .single()
    if (fetchError) throw fetchError
    if (!item) throw new Error('Signal not found.')

    const classification = await classifyRadarItem({
      title: item.title,
      summary: item.summary ?? undefined,
      url: item.url ?? undefined,
      source_name: item.source_name ?? undefined,
    })

    const { error } = await supabase
      .from('radar_items')
      .update({
        category: classification.category,
        tags: classification.tags,
        business_vertical: classification.business_vertical,
        ai_summary: classification.ai_summary,
        why_it_matters: classification.why_it_matters,
        recommended_action: classification.recommended_action,
        linkedin_angle: classification.linkedin_angle,
        instagram_angle: classification.instagram_angle,
        x_angle: classification.x_angle,
        relevance_score: classification.relevance_score,
        urgency_score: classification.urgency_score,
        content_potential_score: classification.content_potential_score,
        business_value_score: classification.business_value_score,
        status: 'reviewed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) throw error

    await logRadarActivity(supabase, user.id, 'AI classification applied', 'radar_item', id, {
      category: classification.category,
      relevance_score: classification.relevance_score,
      is_placeholder: classification.is_placeholder,
    })
    revalidatePath(`/internal/radar/${id}`)
    revalidateRadar()
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateRadarItemStatus(id: string, status: RadarItemStatus): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)

    const { error } = await supabase
      .from('radar_items')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    await logRadarActivity(supabase, user.id, `Signal status → ${status}`, 'radar_item', id, { status })
    revalidatePath(`/internal/radar/${id}`)
    revalidateRadar()
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function createContentDraft(input: {
  radar_item_id: string
  platform: RadarContentPlatform
  content_type: RadarContentType
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)

    const { data: item, error: fetchError } = await supabase
      .from('radar_items')
      .select('*')
      .eq('id', input.radar_item_id)
      .single()
    if (fetchError) throw fetchError
    if (!item) throw new Error('Signal not found.')

    let draftBody = ''
    let hook: string | undefined
    let hashtags: string[] = []
    let carouselOutline: Record<string, unknown>[] | undefined
    let isPlaceholder = false
    let placeholderReason: string | undefined

    if (input.platform === 'linkedin') {
      const draft = await generateLinkedInDraft(item)
      draftBody = draft.draft_body
      hook = draft.hook
      hashtags = draft.hashtags
      isPlaceholder = draft.is_placeholder
      placeholderReason = draft.placeholder_reason
    } else if (input.platform === 'instagram') {
      const draft = await generateInstagramCaption(item)
      draftBody = draft.draft_body
      hook = draft.hook
      hashtags = draft.hashtags
      isPlaceholder = draft.is_placeholder
      placeholderReason = draft.placeholder_reason
    } else if (input.platform === 'x') {
      const draft = await generateXDraft(item)
      draftBody = draft.draft_body
      hashtags = draft.hashtags
      isPlaceholder = draft.is_placeholder
      placeholderReason = draft.placeholder_reason
    } else if (input.content_type === 'carousel') {
      const draft = await generateCarouselOutline(item)
      carouselOutline = draft.slides as unknown as Record<string, unknown>[]
      hashtags = draft.hashtags
      draftBody = draft.slides.map(s => `${s.title}\n${s.bullets.join('\n')}`).join('\n\n')
      isPlaceholder = draft.is_placeholder
      placeholderReason = draft.placeholder_reason
    }

    const { data, error } = await supabase
      .from('radar_content_ideas')
      .insert({
        radar_item_id: input.radar_item_id,
        platform: input.platform,
        content_type: input.content_type,
        hook: hook || null,
        draft_body: draftBody,
        hashtags,
        carousel_outline: carouselOutline || null,
        status: 'draft' as RadarContentStatus,
        notes: isPlaceholder ? `[AI generation unavailable: ${placeholderReason}]` : null,
        created_by: user.id,
      })
      .select('id')
      .single()
    if (error) throw error

    await supabase
      .from('radar_items')
      .update({ status: 'draft_created', updated_at: new Date().toISOString() })
      .eq('id', input.radar_item_id)

    await logRadarActivity(supabase, user.id, `Content draft created (${input.platform})`, 'radar_content_idea', data.id, {
      radar_item_id: input.radar_item_id,
      platform: input.platform,
      content_type: input.content_type,
      is_placeholder: isPlaceholder,
    })
    revalidateRadar()
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateContentIdeaStatus(id: string, status: RadarContentStatus): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)

    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (status === 'approved') updates.approved_by = user.id
    if (status === 'published') updates.published_at = new Date().toISOString()

    const { error } = await supabase
      .from('radar_content_ideas')
      .update(updates)
      .eq('id', id)
    if (error) throw error

    await logRadarActivity(supabase, user.id, `Content idea status → ${status}`, 'radar_content_idea', id, { status })
    revalidateRadar()
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function createRadarAction(input: {
  radar_item_id: string
  action_type: RadarActionType
  title: string
  description?: string
  due_date?: string
  priority?: RadarActionPriority
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)

    const { data, error } = await supabase
      .from('radar_actions')
      .insert({
        radar_item_id: input.radar_item_id,
        action_type: input.action_type,
        title: input.title.trim(),
        description: input.description || null,
        due_date: input.due_date || null,
        priority: input.priority ?? 'normal',
        status: 'open' as RadarActionStatus,
        owner_id: user.id,
        created_by: user.id,
      })
      .select('id')
      .single()
    if (error) throw error

    await logRadarActivity(supabase, user.id, `Radar action created (${input.action_type})`, 'radar_action', data.id, {
      radar_item_id: input.radar_item_id,
      action_type: input.action_type,
    })
    revalidatePath(`/internal/radar/${input.radar_item_id}`)
    revalidateRadar()
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateRadarActionStatus(id: string, status: RadarActionStatus): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)

    const { error } = await supabase
      .from('radar_actions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    await logRadarActivity(supabase, user.id, `Radar action status → ${status}`, 'radar_action', id, { status })
    revalidateRadar()
    return { id }
  } catch (error) {
    return toResult(error)
  }
}
