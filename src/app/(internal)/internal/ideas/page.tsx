import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { ResourceStatusBadge } from '@/components/resource-kit/resource-status-badge'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { BusinessIdea } from '@/types'

const BASE = '/internal/ideas'

const STATUS_GROUPS = [
  { key: 'raw', label: 'Raw' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'validated', label: 'Validated' },
  { key: 'testing', label: 'Testing' },
  { key: 'tested', label: 'Tested' },
] as const

export default async function IdeasVaultPage({ searchParams }: { searchParams: Promise<{ view?: string; priority?: string; vertical?: string }> }) {
  const { view, priority, vertical } = await searchParams
  const showAll = view === 'all'

  const supabase = await createClient()

  let query = supabase.from('business_ideas').select('*').order('created_at', { ascending: false })
  if (!showAll) query = query.not('status', 'in', '("rejected","archived","promoted_to_application")')
  if (priority) query = query.eq('priority', priority)

  const { data: ideas } = await query
  const rows = (ideas ?? []) as BusinessIdea[]

  const { data: verticals } = await supabase.from('business_verticals').select('id, name').order('name')

  const filteredRows = vertical
    ? rows.filter(r => r.vertical_id === vertical)
    : rows

  const grouped = STATUS_GROUPS.map(g => ({
    ...g,
    items: filteredRows.filter(r => r.status === g.key),
  }))

  return (
    <div className="space-y-5">
      <ResourcePageHeader title="Ideas Vault" description="Raw concepts, experiments, and future product ideas" newHref={`${BASE}/new`} newLabel="Add Idea" />

      <div className="flex flex-wrap items-center gap-2">
        <Link href={BASE} className={`rounded-full border px-3 py-1 text-xs transition-colors ${!showAll ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2' : 'border-border text-muted-foreground hover:text-foreground'}`}>Active</Link>
        <Link href={`${BASE}?view=all`} className={`rounded-full border px-3 py-1 text-xs transition-colors ${showAll ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2' : 'border-border text-muted-foreground hover:text-foreground'}`}>All</Link>
        <span className="mx-2 h-4 w-px bg-border" />
        {(['low', 'normal', 'high', 'urgent'] as const).map(p => (
          <Link key={p} href={`${BASE}?${new URLSearchParams({ ...(showAll ? { view: 'all' } : {}), ...(vertical ? { vertical } : {}), priority: priority === p ? '' : p }).toString()}`} className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${priority === p ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2' : 'border-border text-muted-foreground hover:text-foreground'}`}>{p}</Link>
        ))}
        {(verticals ?? []).length > 0 && (
          <>
            <span className="mx-2 h-4 w-px bg-border" />
            {(verticals ?? []).map(v => (
              <Link key={v.id} href={`${BASE}?${new URLSearchParams({ ...(showAll ? { view: 'all' } : {}), ...(priority ? { priority } : {}), vertical: vertical === v.id ? '' : v.id }).toString()}`} className={`rounded-full border px-3 py-1 text-xs transition-colors ${vertical === v.id ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2' : 'border-border text-muted-foreground hover:text-foreground'}`}>{v.name}</Link>
            ))}
          </>
        )}
      </div>

      {filteredRows.length === 0 ? (
        <ResourceEmptyState showAll={showAll} basePath={BASE} />
      ) : (
        <div className="space-y-6">
          {grouped.filter(g => g.items.length > 0).map(group => (
            <section key={group.key}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{group.label} ({group.items.length})</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map(idea => (
                  <Link key={idea.id} href={`${BASE}/${idea.id}`} className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-zo-purple/40">
                    <p className="mb-1 text-sm font-semibold text-foreground line-clamp-1">{idea.title}</p>
                    {idea.description && <p className="mb-2 text-xs text-muted-foreground line-clamp-2">{idea.description}</p>}
                    <div className="flex items-center gap-2">
                      <ResourceStatusBadge status={idea.status} />
                      <Badge variant="outline" className="text-[10px]">{idea.priority}</Badge>
                      {idea.local_folder_path && <Badge variant="outline" className="text-[10px]">📁 linked</Badge>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
