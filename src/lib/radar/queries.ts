import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { RadarItem, RadarSource, RadarContentIdea, RadarAction, RadarItemStatus, RadarItemCategory } from '@/types'

type Supabase = Awaited<ReturnType<typeof createClient>>

export type RadarDashboardCounts = {
  total: number
  new: number
  saved: number
  content_ideas: number
  events_upcoming: number
  high_relevance: number
  migrationMissing: boolean
}

export type RadarItemFilters = {
  status?: RadarItemStatus
  category?: RadarItemCategory
  view?: 'active' | 'all'
  limit?: number
  offset?: number
}

export async function getRadarDashboardCounts(supabase: Supabase): Promise<RadarDashboardCounts> {
  const probe = await supabase.from('radar_items').select('id', { count: 'exact', head: true })
  if (probe.error?.code === '42P01' || probe.error?.message?.includes('does not exist')) {
    return { total: 0, new: 0, saved: 0, content_ideas: 0, events_upcoming: 0, high_relevance: 0, migrationMissing: true }
  }

  const [newItems, saved, contentIdeas, events] = await Promise.all([
    supabase.from('radar_items').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('radar_items').select('id', { count: 'exact', head: true }).eq('status', 'saved'),
    supabase.from('radar_items').select('id', { count: 'exact', head: true }).eq('status', 'content_idea'),
    supabase.from('radar_items').select('id', { count: 'exact', head: true })
      .in('status', ['event_interested', 'event_registered'])
      .gte('event_start_time', new Date().toISOString()),
  ])

  const highRelevance = await supabase
    .from('radar_items')
    .select('id', { count: 'exact', head: true })
    .gte('relevance_score', 7)
    .not('status', 'in', '(ignored,archived)')

  return {
    total: probe.count ?? 0,
    new: newItems.count ?? 0,
    saved: saved.count ?? 0,
    content_ideas: contentIdeas.count ?? 0,
    events_upcoming: events.count ?? 0,
    high_relevance: highRelevance.count ?? 0,
    migrationMissing: false,
  }
}

export async function getRadarItems(supabase: Supabase, filters: RadarItemFilters = {}): Promise<RadarItem[]> {
  const { status, category, view = 'active', limit = 50, offset = 0 } = filters

  let query = supabase
    .from('radar_items')
    .select('*, source:radar_sources(id, name, source_type, trust_level)')
    .order('captured_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (view === 'active') {
    query = query.not('status', 'in', '(ignored,archived)')
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) return []
    throw error
  }
  return (data ?? []) as unknown as RadarItem[]
}

export async function getRadarItemById(supabase: Supabase, id: string): Promise<RadarItem | null> {
  const { data, error } = await supabase
    .from('radar_items')
    .select('*, source:radar_sources(id, name, source_type, trust_level, url)')
    .eq('id', id)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as unknown as RadarItem
}

export async function getRadarSources(supabase: Supabase, activeOnly = true): Promise<RadarSource[]> {
  let query = supabase
    .from('radar_sources')
    .select('*')
    .order('priority', { ascending: false })
    .order('name')

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) return []
    throw error
  }
  return (data ?? []) as RadarSource[]
}

export async function getRadarEvents(supabase: Supabase): Promise<RadarItem[]> {
  const { data, error } = await supabase
    .from('radar_items')
    .select('*, source:radar_sources(id, name, source_type)')
    .in('category', ['local_event', 'global_event', 'webinar', 'workshop', 'conference', 'hackathon'])
    .not('status', 'in', '(ignored,archived)')
    .order('event_start_time', { ascending: true })

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) return []
    throw error
  }
  return (data ?? []) as unknown as RadarItem[]
}

export async function getRadarContentIdeas(supabase: Supabase, view: 'active' | 'all' = 'active'): Promise<RadarContentIdea[]> {
  let query = supabase
    .from('radar_content_ideas')
    .select('*, radar_item:radar_items(id, title, category, relevance_score)')
    .order('created_at', { ascending: false })

  if (view === 'active') {
    query = query.not('status', 'in', '(rejected,archived,published)')
  }

  const { data, error } = await query
  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) return []
    throw error
  }
  return (data ?? []) as unknown as RadarContentIdea[]
}

export async function getRadarActionsForItem(supabase: Supabase, radarItemId: string): Promise<RadarAction[]> {
  const { data, error } = await supabase
    .from('radar_actions')
    .select('*')
    .eq('radar_item_id', radarItemId)
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) return []
    throw error
  }
  return (data ?? []) as RadarAction[]
}
