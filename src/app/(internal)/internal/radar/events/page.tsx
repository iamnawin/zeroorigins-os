import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getRadarEvents } from '@/lib/radar/queries'

export default async function RadarEventsPage() {
  const supabase = await createClient()
  const events = await getRadarEvents(supabase)

  const now = new Date()
  const upcoming = events.filter(e => !e.event_start_time || new Date(e.event_start_time) >= now)
  const past = events.filter(e => e.event_start_time && new Date(e.event_start_time) < now)

  return (
    <div className="space-y-5">
      <ResourcePageHeader
        title="Events"
        description="Upcoming webinars, conferences, workshops, and hackathons"
      />

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/internal/radar" className="hover:text-foreground">Radar</Link>
        <span>/</span>
        <span className="text-foreground">Events</span>
      </div>

      {events.length === 0 ? (
        <ResourceEmptyState showAll={false} basePath="/internal/radar" />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Upcoming ({upcoming.length})</h2>
              <div className="space-y-3">
                {upcoming.map(event => (
                  <Link
                    key={event.id}
                    href={`/internal/radar/${event.id}`}
                    className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-zo-purple/40"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{event.title}</p>
                      <ResourceStatusBadge status={event.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {event.event_start_time && (
                        <span>{new Date(event.event_start_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      )}
                      {event.event_mode && <Badge variant="outline" className="text-[10px]">{event.event_mode}</Badge>}
                      {event.event_organizer && <span>by {event.event_organizer}</span>}
                      {event.location_city && <span>{event.location_city}</span>}
                    </div>
                    {event.ai_summary && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{event.ai_summary}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Past ({past.length})</h2>
              <div className="space-y-2">
                {past.map(event => (
                  <Link
                    key={event.id}
                    href={`/internal/radar/${event.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-2 opacity-50 hover:opacity-70"
                  >
                    <span className="text-sm text-foreground">{event.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {event.event_start_time && new Date(event.event_start_time).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
