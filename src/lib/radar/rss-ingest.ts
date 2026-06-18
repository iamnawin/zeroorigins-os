import 'server-only'

import Parser from 'rss-parser'
import { createServiceClient } from '@/lib/supabase/service'
import { classifyRadarItem } from './ai'

const MAX_ITEMS_PER_SOURCE = 10

const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'fbclid', 'gclid', 'ref', 'mc_cid', 'mc_eid',
]

function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw)
    TRACKING_PARAMS.forEach(p => u.searchParams.delete(p))
    u.pathname = u.pathname.replace(/\/+$/, '') || '/'
    return u.toString()
  } catch {
    return raw
  }
}

export type IngestSourceResult = {
  source: string
  inserted: number
  skipped: number
  item_errors: number
  error: string | null
}

export type IngestAllResult = {
  total: number
  results: IngestSourceResult[]
}

export async function ingestRssSource(sourceId: string, opts: {
  name: string
  rss_url: string
}): Promise<IngestSourceResult> {
  const parser = new Parser({ timeout: 10000 })
  const feed = await parser.parseURL(opts.rss_url)

  const supabase = createServiceClient()
  let inserted = 0
  let skipped = 0
  let item_errors = 0

  for (const item of feed.items.slice(0, MAX_ITEMS_PER_SOURCE)) {
    try {
      const rawUrl = item.link || item.guid
      if (!rawUrl) { skipped++; continue }
      const url = normalizeUrl(rawUrl)

      const { data: existing } = await supabase
        .from('radar_items')
        .select('id')
        .eq('canonical_url', url)
        .maybeSingle()

      if (existing) { skipped++; continue }

      const title = item.title || url
      const summary = item.contentSnippet || item.summary || undefined

      const classification = await classifyRadarItem({ title, summary, url, source_name: opts.name })
      const aiFields = classification.is_placeholder
        ? { ai_summary: classification.ai_summary }
        : {
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

      const { error: insertError } = await supabase.from('radar_items').insert({
        source_id: sourceId,
        source_name: opts.name,
        source_type: 'rss',
        title,
        summary: summary ?? null,
        url: rawUrl,
        canonical_url: url,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        captured_at: new Date().toISOString(),
        status: 'new',
        tags: [],
        relevance_score: 0,
        urgency_score: 0,
        content_potential_score: 0,
        business_value_score: 0,
        ...aiFields,
      })

      if (insertError) {
        // unique constraint violation = duplicate — count as skipped
        if (insertError.code === '23505') { skipped++ } else { item_errors++ }
        continue
      }

      inserted++
    } catch {
      item_errors++
    }
  }

  await supabase
    .from('radar_sources')
    .update({ last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', sourceId)

  return { source: opts.name, inserted, skipped, item_errors, error: null }
}

export async function ingestAllRssSources(): Promise<IngestAllResult> {
  const supabase = createServiceClient()

  const { data: sources, error } = await supabase
    .from('radar_sources')
    .select('id, name, rss_url')
    .eq('is_active', true)
    .not('rss_url', 'is', null)

  if (error) throw error
  if (!sources?.length) return { total: 0, results: [] }

  const results: IngestSourceResult[] = []

  for (const source of sources) {
    try {
      const result = await ingestRssSource(source.id, {
        name: source.name,
        rss_url: source.rss_url as string,
      })
      results.push(result)
    } catch (err) {
      results.push({ source: source.name, inserted: 0, skipped: 0, item_errors: 0, error: String(err) })
    }
  }

  return { total: sources.length, results }
}
