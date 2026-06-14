'use server'

import { revalidatePath } from 'next/cache'
import { callTogetherChat, parseJsonObject } from '@/lib/ai/together-client'
import {
  ZO_AGENT_CONFIRMABLE_INTENTS,
  ZO_AGENT_INTENT_MODES,
  buildZoAgentSystemPrompt,
} from '@/lib/ai/assist-intents'
import { createClient } from '@/lib/supabase/server'
import { requireInternalUser } from './internal-resources'
import {
  AI_ASSIST_INTENTS,
  APPLICATION_STAGES,
  APPLICATION_TYPES,
  BUSINESS_IDEA_PRIORITIES,
  BUSINESS_IDEA_STATUSES,
  type AiAssistIntent,
  type AiAssistInputMode,
  type FinanceCategory,
  type FinanceTransactionStatus,
  type RecurrenceInterval,
  type ZoAgentOutput,
  type ZoAgentQueryResult,
} from '@/types'

type AiActionResult<T = Record<string, unknown>> = {
  data?: T
  error?: string
}

type MeetingAiPayload = {
  summary?: string
  next_action?: string
}

type FinanceAiPayload = {
  category?: FinanceCategory
  status?: FinanceTransactionStatus
  recurrence_interval?: RecurrenceInterval
  notes?: string
}

export type ZoAgentResponse = {
  id?: string
  output: ZoAgentOutput
  results?: ZoAgentQueryResult[]
  model: string
}

export type AiAssistDraftInput = {
  inputText: string
  intent?: AiAssistIntent
  inputMode?: AiAssistInputMode
}

export type FinanceAiInput = {
  description: string
  amount?: string
  vendor?: string
  notes?: string
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

function toResult<T>(error: unknown): AiActionResult<T> {
  return { error: error instanceof Error ? error.message : 'AI assist failed.' }
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(item => asString(item)).filter(Boolean) : []
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function pickAllowed<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const candidate = asString(value) as T
  return allowed.includes(candidate) ? candidate : fallback
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function firstDateTime(date?: string, time?: string) {
  if (!date && !time) return new Date().toISOString()
  if (date && time) return `${date}T${time.length === 5 ? `${time}:00` : time}`
  if (date) return `${date}T09:00:00`
  return new Date().toISOString()
}

async function findVerticalId(supabase: SupabaseServerClient, name?: string) {
  const verticalName = asString(name)
  if (!verticalName) return null

  const { data } = await supabase
    .from('business_verticals')
    .select('id')
    .ilike('name', `%${verticalName}%`)
    .limit(1)
    .maybeSingle()

  return data?.id ?? null
}

function normalizeZoAgentOutput(raw: Record<string, unknown>, requestedIntent?: AiAssistIntent): ZoAgentOutput {
  const parsedIntent = asString(raw.intent) as AiAssistIntent
  const intent = requestedIntent
    ?? (AI_ASSIST_INTENTS.includes(parsedIntent) ? parsedIntent : 'unknown')

  const rawConfidence = typeof raw.confidence === 'number' ? raw.confidence : 0
  const confidence = rawConfidence > 1 ? Math.min(rawConfidence / 100, 1) : Math.max(rawConfidence, 0)

  return {
    intent,
    mode: ZO_AGENT_INTENT_MODES[intent],
    title: asString(raw.title),
    summary: asString(raw.summary),
    confidence,
    requires_confirmation: ZO_AGENT_CONFIRMABLE_INTENTS.includes(intent),
    draft: asRecord(raw.draft),
    query: asRecord(raw.query),
    next_actions: asStringArray(raw.next_actions),
    warnings: asStringArray(raw.warnings),
  }
}

const MISSING_SOURCE_COLUMNS: Record<string, string> = {
  repo: 'repo_url',
  local_folder: 'local_folder_path',
  docs: 'docs_url',
  deployment: 'deployment_url',
  website: 'website_url',
}

async function runZoAgentQuery(
  supabase: SupabaseServerClient,
  output: ZoAgentOutput,
): Promise<{ results: ZoAgentQueryResult[]; warnings: string[]; summary?: string }> {
  const query = output.query ?? {}

  if (output.intent === 'query_emails') {
    return {
      results: [],
      warnings: ['Email inbox is not connected to ZeroOrigins OS yet. Connect the Email Router automation to enable email queries.'],
      summary: output.summary || 'No email source is connected yet, so there are no emails to show.',
    }
  }

  if (output.intent === 'query_tasks') {
    const { data } = await supabase
      .from('tasks')
      .select('id, title, status, due_date')
      .not('status', 'in', '("done","cancelled")')
      .order('created_at', { ascending: false })
      .limit(10)
    return {
      results: (data ?? []).map(row => ({
        id: row.id,
        title: row.title,
        subtitle: row.due_date ? `Due ${row.due_date}` : undefined,
        badge: row.status,
        href: `/internal/tasks/${row.id}`,
      })),
      warnings: [],
    }
  }

  if (output.intent === 'query_projects') {
    const { data } = await supabase
      .from('projects')
      .select('id, title, status, target_date')
      .not('status', 'in', '("archived","cancelled")')
      .order('created_at', { ascending: false })
      .limit(10)
    return {
      results: (data ?? []).map(row => ({
        id: row.id,
        title: row.title,
        subtitle: row.target_date ? `Target ${row.target_date}` : undefined,
        badge: row.status,
        href: `/internal/projects/${row.id}`,
      })),
      warnings: [],
    }
  }

  if (output.intent === 'query_ideas') {
    const { data } = await supabase
      .from('business_ideas')
      .select('id, title, status, priority')
      .not('status', 'in', '("rejected","archived")')
      .order('created_at', { ascending: false })
      .limit(10)
    return {
      results: (data ?? []).map(row => ({
        id: row.id,
        title: row.title,
        subtitle: `Priority ${row.priority}`,
        badge: row.status,
        href: `/internal/ideas/${row.id}`,
      })),
      warnings: [],
    }
  }

  if (output.intent === 'query_verticals') {
    const { data } = await supabase
      .from('business_verticals')
      .select('id, name, type, status')
      .order('name')
      .limit(20)
    return {
      results: (data ?? []).map(row => ({
        id: row.id,
        title: row.name,
        subtitle: row.type,
        badge: row.status,
        href: `/internal/business-verticals/${row.id}`,
      })),
      warnings: [],
    }
  }

  if (output.intent === 'query_applications') {
    let appQuery = supabase
      .from('applications')
      .select('id, name, stage, status, repo_url, local_folder_path')
      .order('name')
      .limit(20)
    const stage = asString(query.stage).replace(/[\s-]+/g, '_')
    if (stage && (APPLICATION_STAGES as readonly string[]).includes(stage)) {
      appQuery = appQuery.eq('stage', stage)
    }
    const missing = MISSING_SOURCE_COLUMNS[asString(query.missing_source)]
    if (missing) appQuery = appQuery.is(missing, null)
    const { data } = await appQuery
    return {
      results: (data ?? []).map(row => ({
        id: row.id,
        title: row.name,
        subtitle: row.stage.replace(/_/g, ' '),
        badge: row.status,
        href: `/internal/applications/${row.id}`,
      })),
      warnings: [],
    }
  }

  if (output.intent === 'find_missing_sources') {
    const missingKey = asString(query.missing) || 'all'
    const columns = missingKey === 'all'
      ? Object.values(MISSING_SOURCE_COLUMNS)
      : [MISSING_SOURCE_COLUMNS[missingKey] ?? MISSING_SOURCE_COLUMNS.repo]
    const orFilter = columns.map(column => `${column}.is.null`).join(',')
    const { data } = await supabase
      .from('applications')
      .select('id, name, stage, repo_url, local_folder_path, docs_url, deployment_url, website_url')
      .or(orFilter)
      .order('name')
      .limit(20)
    return {
      results: (data ?? []).map(row => {
        const gaps = Object.entries(MISSING_SOURCE_COLUMNS)
          .filter(([, column]) => columns.includes(column) && !(row as Record<string, unknown>)[column])
          .map(([label]) => label.replace(/_/g, ' '))
        return {
          id: row.id,
          title: row.name,
          subtitle: gaps.length ? `Missing: ${gaps.join(', ')}` : undefined,
          badge: row.stage.replace(/_/g, ' '),
          href: `/internal/applications/${row.id}`,
        }
      }),
      warnings: [],
    }
  }

  if (output.intent === 'summarize_today') {
    const today = new Date().toISOString().slice(0, 10)
    const [{ data: tasks }, { data: meetings }] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, status, due_date')
        .not('status', 'in', '("done","cancelled")')
        .lte('due_date', today)
        .order('due_date')
        .limit(10),
      supabase
        .from('meetings')
        .select('id, title, scheduled_at, status')
        .gte('scheduled_at', `${today}T00:00:00`)
        .lte('scheduled_at', `${today}T23:59:59`)
        .order('scheduled_at')
        .limit(10),
    ])

    const results: ZoAgentQueryResult[] = [
      ...(tasks ?? []).map(row => ({
        id: row.id,
        title: row.title,
        subtitle: row.due_date ? `Due ${row.due_date}` : undefined,
        badge: 'task',
        href: `/internal/tasks/${row.id}`,
      })),
      ...(meetings ?? []).map(row => ({
        id: row.id,
        title: row.title,
        subtitle: new Date(row.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        badge: 'meeting',
        href: `/internal/meetings/${row.id}`,
      })),
    ]

    const summary = `${(tasks ?? []).length} open task(s) due by today and ${(meetings ?? []).length} meeting(s) scheduled today.`
    return { results, warnings: [], summary: output.summary || summary }
  }

  return { results: [], warnings: [] }
}

export async function createAiAssistDraft(input: AiAssistDraftInput): Promise<AiActionResult<ZoAgentResponse>> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const inputText = requiredInputText(input.inputText)

    const { data: verticals } = await supabase
      .from('business_verticals')
      .select('name')
      .order('name')
      .limit(30)

    const result = await callTogetherChat({
      task: 'crm_planning',
      maxTokens: 800,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: buildZoAgentSystemPrompt({
            intent: input.intent,
            verticalNames: (verticals ?? []).map(row => row.name),
            today: new Date().toISOString().slice(0, 10),
          }),
        },
        { role: 'user', content: inputText },
      ],
    })

    const parsed = parseJsonObject<Record<string, unknown>>(result.content)
    const output = normalizeZoAgentOutput(parsed, input.intent)
    output.input_mode = input.inputMode ?? 'text'

    const relatedVerticalId = await findVerticalId(
      supabase,
      asString(output.draft?.related_vertical) || asString(output.draft?.vertical) || asString(output.query?.related_vertical),
    )

    const isExecutable = output.mode === 'query' || output.mode === 'summary'
    let results: ZoAgentQueryResult[] | undefined
    if (isExecutable) {
      const executed = await runZoAgentQuery(supabase, output)
      results = executed.results
      output.warnings = [...(output.warnings ?? []), ...executed.warnings]
      if (executed.summary) output.summary = executed.summary
    }

    const { data, error } = await supabase
      .from('ai_assist_requests')
      .insert({
        user_id: user.id,
        intent: output.intent,
        input_text: inputText,
        ai_output_json: { ...output, input_mode: input.inputMode ?? 'text' },
        status: isExecutable ? 'confirmed' : 'draft',
        related_vertical_id: relatedVerticalId,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidatePath('/internal/control-room')
    return { data: { id: data.id, output, results, model: result.model } }
  } catch (error) {
    return toResult(error)
  }
}

export async function confirmAiAssistDraft(requestId: string, editedOutput?: ZoAgentOutput): Promise<AiActionResult<{ id: string; intent: AiAssistIntent; href?: string }>> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data: request, error } = await supabase
      .from('ai_assist_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (error) throw error
    if (!request) throw new Error('ZO_Agent draft not found.')
    if (request.status !== 'draft') throw new Error('Only draft ZO_Agent requests can be confirmed.')

    const output = editedOutput ?? request.ai_output_json as ZoAgentOutput
    const intent = request.intent as AiAssistIntent
    const draft = asRecord(output.draft)
    const links: Record<string, string> = {}
    let createdId: string | null = null
    let href: string | undefined
    const relatedVerticalId = request.related_vertical_id
      ?? await findVerticalId(supabase, asString(draft.related_vertical) || asString(draft.vertical))

    if (intent === 'create_task' || intent === 'create_followup') {
      const { data, error: createError } = await supabase
        .from('tasks')
        .insert({
          title: requiredInputText(asString(draft.task_title) || asString(draft.subject) || output.title || 'ZO_Agent task'),
          description: asString(draft.description) || asString(draft.message) || request.input_text,
          due_date: asString(draft.due_date) || null,
          status: 'todo',
          related_vertical_id: relatedVerticalId,
          owner_id: user.id,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (createError) throw createError
      createdId = data.id
      links.related_task_id = data.id
      href = `/internal/tasks/${data.id}`
    } else if (intent === 'schedule_meeting') {
      const { data, error: createError } = await supabase
        .from('meetings')
        .insert({
          title: requiredInputText(asString(draft.meeting_title) || output.title || 'ZO_Agent meeting'),
          scheduled_at: firstDateTime(asString(draft.date), asString(draft.start_time)),
          duration_minutes: 30,
          attendees: asStringArray(draft.attendees),
          agenda: asStringArray(draft.agenda).join('\n'),
          notes: asString(draft.notes),
          source: 'manual',
          sync_status: 'not_connected',
          status: 'scheduled',
          related_vertical_id: relatedVerticalId,
          owner_id: user.id,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (createError) throw createError
      createdId = data.id
      links.related_meeting_id = data.id
      href = `/internal/meetings/${data.id}`
    } else if (intent === 'create_proposal') {
      const content = [
        asString(draft.problem_statement) && `Problem\n${asString(draft.problem_statement)}`,
        asString(draft.proposed_solution) && `Proposed solution\n${asString(draft.proposed_solution)}`,
        asStringArray(draft.deliverables).length && `Deliverables\n${asStringArray(draft.deliverables).join('\n')}`,
        asString(draft.commercials) && `Commercials\n${asString(draft.commercials)}`,
        asString(draft.next_step) && `Next step\n${asString(draft.next_step)}`,
      ].filter(Boolean).join('\n\n')

      const { data, error: createError } = await supabase
        .from('proposals')
        .insert({
          title: requiredInputText(asString(draft.proposal_title) || output.title || 'ZO_Agent proposal outline'),
          content: content || request.input_text,
          scope: asStringArray(draft.scope).join('\n'),
          timeline: asString(draft.timeline),
          status: 'draft',
          related_vertical_id: relatedVerticalId,
          owner_id: user.id,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (createError) throw createError
      createdId = data.id
      href = `/internal/proposals/${data.id}`
    } else if (intent === 'create_project') {
      const { data, error: createError } = await supabase
        .from('projects')
        .insert({
          title: requiredInputText(asString(draft.project_title) || output.title || 'ZO_Agent project'),
          description: asString(draft.description) || request.input_text,
          status: 'draft',
          start_date: asString(draft.start_date) || null,
          target_date: asString(draft.target_date) || null,
          related_vertical_id: relatedVerticalId,
          owner_id: user.id,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (createError) throw createError
      createdId = data.id
      href = `/internal/projects/${data.id}`
    } else if (intent === 'create_idea') {
      const { data, error: createError } = await supabase
        .from('business_ideas')
        .insert({
          title: requiredInputText(asString(draft.idea_title) || output.title || 'ZO_Agent idea'),
          description: asString(draft.description) || request.input_text,
          vertical_id: relatedVerticalId,
          status: pickAllowed(draft.status, BUSINESS_IDEA_STATUSES, 'raw'),
          priority: pickAllowed(draft.priority, BUSINESS_IDEA_PRIORITIES, 'normal'),
          source: asString(draft.source) || 'ZO_Agent',
          local_folder_path: asString(draft.local_folder_path) || null,
          next_action: asString(draft.next_action) || null,
          owner_id: user.id,
        })
        .select('id')
        .single()

      if (createError) throw createError
      createdId = data.id
      links.related_idea_id = data.id
      href = `/internal/ideas/${data.id}`
    } else if (intent === 'promote_idea_to_application' || intent === 'create_application') {
      let sourceIdea: { id: string; title: string } | null = null
      if (intent === 'promote_idea_to_application') {
        const ideaName = asString(draft.source_idea) || asString(draft.application_name) || output.title
        if (ideaName) {
          const { data: idea } = await supabase
            .from('business_ideas')
            .select('id, title')
            .ilike('title', `%${ideaName}%`)
            .not('status', 'in', '("rejected","archived","promoted_to_application")')
            .limit(1)
            .maybeSingle()
          sourceIdea = idea ?? null
        }
        if (!sourceIdea) throw new Error('Could not find a matching idea in the Ideas Vault to promote. Check the idea title and try again.')
      }

      const name = requiredInputText(asString(draft.application_name) || output.title || sourceIdea?.title || 'ZO_Agent application')
      const { data, error: createError } = await supabase
        .from('applications')
        .insert({
          name,
          slug: slugify(name) || null,
          description: asString(draft.description) || request.input_text,
          vertical_id: relatedVerticalId,
          stage: pickAllowed(draft.stage, APPLICATION_STAGES, intent === 'promote_idea_to_application' ? 'prototype' : 'concept'),
          status: 'active',
          type: pickAllowed(draft.type, APPLICATION_TYPES, 'application'),
          repo_url: asString(draft.repo_url) || null,
          local_folder_path: asString(draft.local_folder_path) || null,
          docs_url: asString(draft.docs_url) || null,
          docs_folder_path: asString(draft.docs_folder_path) || null,
          website_url: asString(draft.website_url) || null,
          deployment_url: asString(draft.deployment_url) || null,
          database_url: asString(draft.database_url) || null,
          n8n_workflow_url: asString(draft.n8n_workflow_url) || null,
          figma_url: asString(draft.figma_url) || null,
          tech_stack: asStringArray(draft.tech_stack),
          notes: asString(draft.notes) || null,
          source_idea_id: sourceIdea?.id ?? null,
          owner_id: user.id,
        })
        .select('id')
        .single()

      if (createError) throw createError
      createdId = data.id
      links.related_application_id = data.id
      href = `/internal/applications/${data.id}`

      if (sourceIdea) {
        const { error: promoteError } = await supabase
          .from('business_ideas')
          .update({ status: 'promoted_to_application', promoted_application_id: data.id })
          .eq('id', sourceIdea.id)
        if (promoteError) throw promoteError
        links.related_idea_id = sourceIdea.id
      }
    } else if (intent === 'update_application_source') {
      const appName = asString(draft.application_name)
      if (!appName) throw new Error('ZO_Agent draft is missing the application name.')
      const { data: app } = await supabase
        .from('applications')
        .select('id, name')
        .ilike('name', `%${appName}%`)
        .limit(1)
        .maybeSingle()
      if (!app) throw new Error(`No application named "${appName}" found in the Application Registry.`)

      const sourceType = asString(draft.source_type) || 'other'
      const sourceUrl = asString(draft.source_url) || null
      const localPath = asString(draft.local_path) || null
      const SOURCE_COLUMN_MAP: Record<string, { column: string; value: string | null }> = {
        repo: { column: 'repo_url', value: sourceUrl },
        local_folder: { column: 'local_folder_path', value: localPath },
        docs: { column: 'docs_url', value: sourceUrl },
        deployment: { column: 'deployment_url', value: sourceUrl },
        website: { column: 'website_url', value: sourceUrl },
        figma: { column: 'figma_url', value: sourceUrl },
        n8n: { column: 'n8n_workflow_url', value: sourceUrl },
        supabase: { column: 'database_url', value: sourceUrl },
      }
      const mapped = SOURCE_COLUMN_MAP[sourceType]
      if (mapped?.value) {
        const { error: updateAppError } = await supabase
          .from('applications')
          .update({ [mapped.column]: mapped.value })
          .eq('id', app.id)
        if (updateAppError) throw updateAppError
      }

      const { error: sourceError } = await supabase
        .from('source_registry')
        .upsert({
          name: `${app.name} — ${sourceType}`,
          source_type: sourceType,
          source_url: sourceUrl,
          local_path: localPath,
          related_application_id: app.id,
          status: 'active',
          notes: asString(draft.notes) || null,
        }, { onConflict: 'name' })
      if (sourceError) throw sourceError

      createdId = app.id
      links.related_application_id = app.id
      href = `/internal/applications/${app.id}`
    } else {
      throw new Error('This ZO_Agent output is review-only and cannot create a record.')
    }

    const { error: updateError } = await supabase
      .from('ai_assist_requests')
      .update({ status: 'created', ai_output_json: output, related_vertical_id: relatedVerticalId, ...links })
      .eq('id', requestId)

    if (updateError) throw updateError
    revalidatePath('/internal/control-room')
    revalidatePath('/internal/tasks')
    revalidatePath('/internal/meetings')
    revalidatePath('/internal/proposals')
    revalidatePath('/internal/projects')
    revalidatePath('/internal/ideas')
    revalidatePath('/internal/applications')
    if (!createdId) throw new Error('ZO_Agent confirmation did not create a record.')
    return { data: { id: createdId, intent, href } }
  } catch (error) {
    return toResult(error)
  }
}

function requiredInputText(value: string) {
  const trimmed = value.trim()
  if (!trimmed) throw new Error('ZO_Agent input is required.')
  return trimmed
}

export async function testTogetherConnection(): Promise<AiActionResult<{ reply: string; model: string }>> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)

    const result = await callTogetherChat({
      task: 'draft_next_action',
      maxTokens: 120,
      temperature: 0,
      messages: [
        { role: 'system', content: 'You are a concise infrastructure health check for ZeroOrigins CRM.' },
        { role: 'user', content: 'Reply with one short sentence confirming the Together AI connection works.' },
      ],
    })

    return { data: { reply: result.content, model: result.model } }
  } catch (error) {
    return toResult(error)
  }
}

export async function generateMeetingAiAssist(meetingId: string): Promise<AiActionResult<MeetingAiPayload>> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)

    const { data: meeting, error } = await supabase
      .from('meetings')
      .select('id, title, scheduled_at, attendees, agenda, outcome, next_action')
      .eq('id', meetingId)
      .single()

    if (error) throw error
    if (!meeting) throw new Error('Meeting not found.')

    const result = await callTogetherChat({
      task: 'summarize_meeting',
      maxTokens: 350,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'You help a small internal CRM. Return only JSON with keys summary and next_action. Do not change status, schedule, or owner.',
        },
        {
          role: 'user',
          content: [
            `Title: ${meeting.title}`,
            `Scheduled: ${meeting.scheduled_at}`,
            `Attendees: ${(meeting.attendees ?? []).join(', ')}`,
            `Agenda: ${meeting.agenda ?? ''}`,
            `Outcome notes: ${meeting.outcome ?? ''}`,
            `Current next action: ${meeting.next_action ?? ''}`,
          ].join('\n'),
        },
      ],
    })

    const parsed = parseJsonObject<MeetingAiPayload>(result.content)
    const summary = asString(parsed.summary)
    const nextAction = asString(parsed.next_action)

    if (!summary && !nextAction) throw new Error('AI did not return meeting summary fields.')

    const updatePayload: Record<string, string> = {}
    if (summary) updatePayload.outcome = summary
    if (nextAction) updatePayload.next_action = nextAction

    const { error: updateError } = await supabase
      .from('meetings')
      .update(updatePayload)
      .eq('id', meetingId)

    if (updateError) throw updateError

    revalidatePath('/internal/meetings')
    revalidatePath(`/internal/meetings/${meetingId}`)
    revalidatePath('/internal/control-room')
    return { data: { summary, next_action: nextAction } }
  } catch (error) {
    return toResult(error)
  }
}

export async function generateFinanceAiAssist(input: FinanceAiInput): Promise<AiActionResult<FinanceAiPayload>> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)

    const result = await callTogetherChat({
      task: 'extract_bill',
      maxTokens: 300,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: 'You classify company spending for ZeroOrigins. Return only JSON with keys category, status, recurrence_interval, notes.',
        },
        {
          role: 'user',
          content: [
            `Description: ${input.description}`,
            `Amount: ${input.amount ?? ''}`,
            `Vendor: ${input.vendor ?? ''}`,
            `Notes: ${input.notes ?? ''}`,
            'Allowed categories: software, infrastructure, ai_api, marketing, contractor, payroll, travel, office, tax, other.',
            'Allowed statuses: paid, due, overdue, cancelled.',
            'Allowed recurrence_interval: none, monthly, quarterly, yearly.',
          ].join('\n'),
        },
      ],
    })

    const parsed = parseJsonObject<FinanceAiPayload>(result.content)
    return {
      data: {
        category: parsed.category,
        status: parsed.status,
        recurrence_interval: parsed.recurrence_interval,
        notes: asString(parsed.notes),
      },
    }
  } catch (error) {
    return toResult(error)
  }
}
