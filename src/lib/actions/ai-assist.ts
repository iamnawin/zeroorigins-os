'use server'

import { revalidatePath } from 'next/cache'
import { callTogetherChat, parseJsonObject } from '@/lib/ai/together-client'
import { createClient } from '@/lib/supabase/server'
import { requireInternalUser } from './internal-resources'
import type { FinanceCategory, FinanceTransactionStatus, RecurrenceInterval } from '@/types'

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
