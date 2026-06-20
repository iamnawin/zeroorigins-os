import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { RadarScoreBadge } from '@/components/radar/radar-score-badge'
import { RadarItemActions } from '@/components/radar/radar-item-actions'
import { getRadarItemById, getRadarActionsForItem } from '@/lib/radar/queries'

export default async function RadarItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [item, actions] = await Promise.all([
    getRadarItemById(supabase, id),
    getRadarActionsForItem(supabase, id),
  ])

  if (!item) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/internal/radar" className="hover:text-foreground">Radar</Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1">{item.title}</span>
      </div>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-foreground">{item.title}</h1>
          <ResourceStatusBadge status={item.status} className="shrink-0" />
        </div>

        <div className="flex flex-wrap gap-2">
          {item.category && (
            <Badge variant="secondary">{item.category.replace(/_/g, ' ')}</Badge>
          )}
          {item.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Relevance', score: item.relevance_score },
            { label: 'Urgency', score: item.urgency_score },
            { label: 'Content', score: item.content_potential_score },
            { label: 'Business', score: item.business_value_score },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-3 text-center">
              <RadarScoreBadge score={s.score} className="text-sm" />
              <p className="mt-1 text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {item.ai_summary && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Summary</p>
            <p className="text-sm text-foreground">{item.ai_summary}</p>
          </div>
        )}

        {item.why_it_matters && (
          <div className="rounded-lg border border-zo-purple/30 bg-zo-purple/5 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zo-purple-2">Why It Matters</p>
            <p className="text-sm text-foreground">{item.why_it_matters}</p>
          </div>
        )}

        {(item.linkedin_angle || item.instagram_angle || item.x_angle) && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content Angles</p>
            {item.linkedin_angle && (
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase">LinkedIn</span>
                <p className="text-xs text-foreground">{item.linkedin_angle}</p>
              </div>
            )}
            {item.instagram_angle && (
              <div>
                <span className="text-[10px] font-bold text-pink-400 uppercase">Instagram</span>
                <p className="text-xs text-foreground">{item.instagram_angle}</p>
              </div>
            )}
            {item.x_angle && (
              <div>
                <span className="text-[10px] font-bold text-slate-300 uppercase">X</span>
                <p className="text-xs text-foreground">{item.x_angle}</p>
              </div>
            )}
          </div>
        )}

        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-zo-purple-2 underline underline-offset-2 hover:text-zo-purple line-clamp-1"
          >
            {item.url}
          </a>
        )}

        {item.event_start_time && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event Details</p>
            <p className="text-sm text-foreground">
              {new Date(item.event_start_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short', hour12: true })}
              {item.event_end_time && ` – ${new Date(item.event_end_time).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', timeStyle: 'short', hour12: true })}`}
            </p>
            {item.event_mode && <Badge variant="outline" className="mt-1 text-[10px]">{item.event_mode}</Badge>}
            {item.event_organizer && <p className="mt-1 text-xs text-muted-foreground">By {item.event_organizer}</p>}
            {item.registration_url && (
              <a href={item.registration_url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-zo-purple-2 underline">
                Register →
              </a>
            )}
          </div>
        )}

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</p>
          <RadarItemActions itemId={item.id} currentStatus={item.status} />
        </div>

        {actions.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Logged Actions</p>
            <div className="space-y-2">
              {actions.map(action => (
                <div key={action.id} className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{action.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{action.status}</Badge>
                    <Badge variant="outline" className="text-[10px]">{action.priority}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>Captured {new Date(item.captured_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' })}</span>
          {item.source_name && <span>Source: {item.source_name}</span>}
          {item.business_vertical && <span>Vertical: {item.business_vertical}</span>}
        </div>
      </div>
    </div>
  )
}
