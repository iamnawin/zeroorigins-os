import type { AiAssistIntent, ZoAgentOutput } from '@/types'

const FIELD_LABELS: Record<string, string> = {
  amount: 'Amount',
  category: 'Category',
  client_or_company: 'Client',
  currency: 'Currency',
  date: 'Date',
  deal_name: 'Deal',
  description: 'Description',
  expected_close_date: 'Close date',
  estimated_value: 'Estimated value',
  idea_title: 'Idea',
  meeting_title: 'Meeting',
  next_action: 'Next action',
  next_step: 'Next step',
  paid_by: 'Paid by',
  priority: 'Priority',
  project_title: 'Project',
  stage: 'Stage',
  status: 'Status',
  task_title: 'Task',
  vertical: 'Vertical',
}

const INTENT_FIELDS: Partial<Record<AiAssistIntent, string[]>> = {
  create_spending: ['description', 'amount', 'currency', 'category', 'status', 'paid_by', 'date'],
  create_idea: ['idea_title', 'description', 'vertical', 'priority', 'status', 'next_action'],
  create_deal: ['deal_name', 'client_or_company', 'stage', 'estimated_value', 'currency', 'expected_close_date', 'next_step'],
  create_task: ['task_title', 'description', 'priority', 'due_date', 'assigned_to'],
  schedule_meeting: ['meeting_title', 'date', 'start_time', 'end_time', 'attendees'],
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ')
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value.trim()
  return ''
}

export function AiDraftReviewCard({ output }: { output: ZoAgentOutput }) {
  const draft = asRecord(output.draft)
  const preferredFields = INTENT_FIELDS[output.intent] ?? Object.keys(draft).slice(0, 8)
  const rows = preferredFields
    .map(key => ({ key, value: formatValue(draft[key]) }))
    .filter(row => row.value)
  const confidence = typeof output.confidence === 'number' ? Math.round(output.confidence * 100) : null

  return (
    <div className="space-y-3 rounded-md bg-background p-3 text-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{output.title || 'Review draft'}</p>
          <p className="mt-1 text-muted-foreground">Confirm these fields before ZO_Agent creates the record.</p>
        </div>
        {confidence !== null && (
          <span className="shrink-0 rounded-full border border-border px-2 py-1 font-medium text-muted-foreground">
            {confidence}%
          </span>
        )}
      </div>
      {rows.length > 0 ? (
        <dl className="grid gap-2">
          {rows.map(row => (
            <div key={row.key} className="grid grid-cols-[7rem_1fr] gap-2">
              <dt className="text-muted-foreground">{FIELD_LABELS[row.key] ?? row.key.replace(/_/g, ' ')}</dt>
              <dd className="min-w-0 break-words font-medium text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-muted-foreground">No structured fields were returned. Review the prompt and regenerate the draft.</p>
      )}
      <details className="rounded-md border border-border bg-muted/30">
        <summary className="cursor-pointer px-3 py-2 font-medium text-muted-foreground">Structured payload</summary>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words border-t border-border p-3 text-[11px] leading-relaxed text-muted-foreground">
          {JSON.stringify(draft, null, 2)}
        </pre>
      </details>
    </div>
  )
}
