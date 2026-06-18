import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { RadarScoreBadge } from './radar-score-badge'
import type { RadarItem } from '@/types'

interface RadarItemCardProps {
  item: RadarItem
}

const CATEGORY_COLORS: Record<string, string> = {
  ai_news: 'bg-violet-500/10 text-violet-400',
  ai_model_update: 'bg-violet-500/10 text-violet-400',
  ai_tool_update: 'bg-violet-500/10 text-violet-400',
  ai_agent_workflow: 'bg-violet-500/10 text-violet-400',
  salesforce_ai: 'bg-blue-500/10 text-blue-400',
  salesforce_crm: 'bg-blue-500/10 text-blue-400',
  crm_automation: 'bg-blue-500/10 text-blue-400',
  local_event: 'bg-orange-500/10 text-orange-400',
  global_event: 'bg-orange-500/10 text-orange-400',
  webinar: 'bg-orange-500/10 text-orange-400',
  workshop: 'bg-orange-500/10 text-orange-400',
  conference: 'bg-orange-500/10 text-orange-400',
  hackathon: 'bg-orange-500/10 text-orange-400',
  funding: 'bg-green-500/10 text-green-400',
  startup_news: 'bg-green-500/10 text-green-400',
  india_ai: 'bg-amber-500/10 text-amber-400',
  content_opportunity: 'bg-pink-500/10 text-pink-400',
  creator_trend: 'bg-pink-500/10 text-pink-400',
}

export function RadarItemCard({ item }: RadarItemCardProps) {
  const categoryColor = item.category ? CATEGORY_COLORS[item.category] ?? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground'
  const capturedDate = new Date(item.captured_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  return (
    <Link href={`/internal/radar/${item.id}`} className="group block min-h-[184px] rounded-lg border border-border bg-card p-4 transition-colors hover:border-zo-purple/40 hover:bg-card/80">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-semibold text-foreground line-clamp-2 group-hover:text-zo-purple-2">{item.title}</p>
        <ResourceStatusBadge status={item.status} className="shrink-0" />
      </div>

      {(item.ai_summary || item.summary) && (
        <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{item.ai_summary || item.summary}</p>
      )}

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {item.category && (
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${categoryColor}`}>
                {item.category.replace(/_/g, ' ')}
              </span>
            )}
            {item.relevance_score > 0 && (
              <RadarScoreBadge score={item.relevance_score} label="R" />
            )}
            {item.content_potential_score > 0 && (
              <RadarScoreBadge score={item.content_potential_score} label="C" />
            )}
          </div>
          {item.source_name && (
            <Badge variant="outline" className="max-w-full truncate text-[10px] opacity-60">{item.source_name}</Badge>
          )}
        </div>
        <span className="shrink-0 text-[10px] text-muted-foreground">{capturedDate}</span>
      </div>

      {item.why_it_matters && (
        <p className="mt-2 border-t border-border/50 pt-2 text-[11px] text-muted-foreground line-clamp-1">
          {item.why_it_matters}
        </p>
      )}
    </Link>
  )
}
