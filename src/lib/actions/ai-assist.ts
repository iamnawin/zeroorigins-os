'use server'

import { revalidatePath } from 'next/cache'
import { callTogetherChat, parseJsonObject } from '@/lib/ai/together-client'
import { buildAiAssistSystemPrompt } from '@/lib/ai/assist-intents'
import { createClient } from '@/lib/supabase/server'
import { requireInternalUser } from './internal-resources'
import type { AiAssistIntent, FinanceCategory, FinanceTransactionStatus, RecurrenceInterval } from '@/types'

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

type AiAssistDraftPayload = Record<string, unknown> & {
  intent?: AiAssistIntent
  related_vertical?: string
}

export type AiAssistDraftInput = {
  inputText: string
  intent?: AiAssistIntent
}

export type FinanceAiInput = {
  description: string
  amount?: string
  vendor?: string
  notes?: string
}

function toResult<T>(error: unknown): AiActionResult<T> {
  return { error: error instanceof Error ? error.message : 'AI assist failed.' }
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(item => asString(item)).filter(Boolean) : []
}

function firstDateTime(date?: string, time?: string) {
  if (!date && !time) return new Date().toISOString()
  if (date && time) return `${date}T${time.length === 5 ? `${time}:00` : time}`
  if (date) return `${date}T09:00:00`
  return new Date().toISOString()
}

async function findVerticalId(supabase: Awaited<ReturnType<typeof createClient>>, name?: string) {
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

export async function createAiAssistDraft(input: AiAssistDraftInput): Promise<AiActionResult<{ id: string; output: AiAssistDraftPayload }>> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const inputText = requiredInputText(input.inputText)

    const result = await callTogetherChat({
      task: 'crm_planning',
      maxTokens: 650,
      temperature: 0,
      messages: [
        { role: 'system', content: buildAiAssistSystemPrompt(input.intent) },
        { role: 'user', content: inputText },
      ],
    })

    const parsed = parseJsonObject<AiAssistDraftPayload>(result.content)
    const intent = input.intent ?? parsed.intent
    if (!intent) throw new Error('AI did not return a supported intent.')

    const relatedVerticalId = await findVerticalId(supabase, asString(parsed.related_vertical))
    const { data, error } = await supabase
      .from('ai_assist_requests')
      .insert({
        user_id: user.id,
        intent,
        input_text: inputText,
        ai_output_json: parsed,
        status: 'draft',
        related_vertical_id: relatedVerticalId,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidatePath('/internal/control-room')
    return { data: { id: data.id, output: parsed } }
  } catch (error) {
    return toResult(error)
  }
}

export async function confirmAiAssistDraft(requestId: string, editedOutput?: AiAssistDraftPayload): Promise<AiActionResult<{ id: string; intent: AiAssistIntent }>> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data: request, error } = await supabase
      .from('ai_assist_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (error) throw error
    if (!request) throw new Error('AI Assist draft not found.')
    if (request.status !== 'draft') throw new Error('Only draft AI Assist requests can be confirmed.')

    const output = editedOutput ?? request.ai_output_json as AiAssistDraftPayload
    const intent = request.intent as AiAssistIntent
    let createdId: string | null = null
    const relatedVerticalId = request.related_vertical_id ?? await findVerticalId(supabase, asString(output.related_vertical))

    if (intent === 'create_task' || intent === 'create_followup') {
      const { data, error: createError } = await supabase
        .from('tasks')
        .insert({
          title: requiredInputText(asString(output.title) || asString(output.subject) || 'AI follow-up task'),
          description: asString(output.description) || asString(output.message) || request.input_text,
          due_date: asString(output.due_date) || null,
          status: 'todo',
          related_vertical_id: relatedVerticalId,
          owner_id: user.id,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (createError) throw createError
      createdId = data.id
      await supabase.from('ai_assist_requests').update({ related_task_id: createdId }).eq('id', requestId)
    } else if (intent === 'schedule_meeting') {
      const { data, error: createError } = await supabase
        .from('meetings')
        .insert({
          title: requiredInputText(asString(output.title) || 'AI drafted meeting'),
          scheduled_at: firstDateTime(asString(output.date), asString(output.start_time)),
          duration_minutes: 30,
          attendees: asStringArray(output.attendees),
          agenda: asStringArray(output.agenda).join('\n'),
          notes: asString(output.notes),
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
      await supabase.from('ai_assist_requests').update({ related_meeting_id: createdId }).eq('id', requestId)
    } else if (intent === 'create_proposal') {
      const { data, error: createError } = await supabase
        .from('proposals')
        .insert({
          title: requiredInputText(asString(output.title) || 'AI proposal outline'),
          content: asStringArray(output.outline).join('\n'),
          scope: asString(output.scope),
          timeline: asString(output.timeline),
          status: 'draft',
          related_vertical_id: relatedVerticalId,
          owner_id: user.id,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (createError) throw createError
      createdId = data.id
    } else {
      throw new Error('This AI Assist draft is review-only and cannot create a record yet.')
    }

    const { error: updateError } = await supabase
      .from('ai_assist_requests')
      .update({ status: 'created', ai_output_json: output, related_vertical_id: relatedVerticalId })
      .eq('id', requestId)

    if (updateError) throw updateError
    revalidatePath('/internal/control-room')
    revalidatePath('/internal/tasks')
    revalidatePath('/internal/meetings')
    revalidatePath('/internal/proposals')
    if (!createdId) throw new Error('AI Assist confirmation did not create a record.')
    return { data: { id: createdId, intent } }
  } catch (error) {
    return toResult(error)
  }
}

function requiredInputText(value: string) {
  const trimmed = value.trim()
  if (!trimmed) throw new Error('AI Assist input is required.')
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
