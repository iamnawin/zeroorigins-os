import { createClient } from '@/lib/supabase/server'
import { ResourcePageHeader } from '@/components/resource-kit/resource-page-header'
import { ResourceEmptyState } from '@/components/resource-kit/resource-empty-state'
import { EntityTable, type TableColumn } from '@/components/resource-kit/entity-table'
import type { KnowledgeArticle } from '@/types'

const BASE = '/internal/knowledge'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCategory(value?: string | null) {
  return value ? value.replace(/_/g, ' ') : 'uncategorized'
}

const TABLE_COLUMNS: TableColumn<KnowledgeArticle>[] = [
  { key: 'title', label: 'Document', render: row => row.title },
  { key: 'category', label: 'Category', width: '180px', render: row => formatCategory(row.category) },
  { key: 'tags', label: 'Tags', render: row => row.tags?.length ? row.tags.join(', ') : <span className="text-muted-foreground/40">-</span> },
  { key: 'updated_at', label: 'Updated', width: '130px', render: row => formatDate(row.updated_at) },
]

export default async function KnowledgePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('knowledge_articles')
    .select('*')
    .order('updated_at', { ascending: false })

  const rows = (data ?? []) as KnowledgeArticle[]

  return (
    <div className="space-y-5">
      <ResourcePageHeader
        title="Knowledge"
        description="Internal documents, decisions, SOPs, meeting notes, finance docs, and product specs"
        newHref={`${BASE}/new`}
        newLabel="New Document"
      />
      {rows.length === 0 ? (
        <ResourceEmptyState
          showAll={false}
          basePath={BASE}
          title="No knowledge documents yet"
          description="Start with the decisions, project notes, finance/vendor details, SOPs, and meeting notes the team should not have to rediscover."
          actionHref={`${BASE}/new`}
          actionLabel="Create first document"
        />
      ) : (
        <EntityTable rows={rows} columns={TABLE_COLUMNS} getHref={row => `${BASE}/${row.id}`} />
      )}
    </div>
  )
}
