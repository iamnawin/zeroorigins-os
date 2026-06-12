import type { AiAssistIntent } from '@/types'

export const AI_ASSIST_QUICK_ACTIONS: { intent: AiAssistIntent; label: string }[] = [
  { intent: 'create_task', label: 'Create task' },
  { intent: 'schedule_meeting', label: 'Schedule meeting' },
  { intent: 'draft_email', label: 'Draft reply' },
  { intent: 'summarize_email', label: 'Summarize email' },
  { intent: 'create_proposal', label: 'Create proposal outline' },
  { intent: 'create_followup', label: 'Generate follow-up' },
  { intent: 'summarize_day', label: 'Summarize today' },
]

export const AI_ASSIST_INTENT_SCHEMAS: Record<AiAssistIntent, string> = {
  create_task: '{"intent":"create_task","title":"","description":"","priority":"normal","due_date":"","assigned_to":"","related_vertical":"","confidence":0}',
  schedule_meeting: '{"intent":"schedule_meeting","title":"","date":"","start_time":"","end_time":"","attendees":[],"related_vertical":"","agenda":[],"notes":"","confidence":0}',
  draft_email: '{"intent":"draft_email","recipient":"","subject":"","message":"","tone":"professional","confidence":0}',
  summarize_email: '{"intent":"summarize_email","summary":"","sender":"","action_items":[],"urgency":"normal","confidence":0}',
  create_followup: '{"intent":"create_followup","channel":"email","recipient":"","subject":"","message":"","related_lead":"","related_vertical":"","confidence":0}',
  create_proposal: '{"intent":"create_proposal","title":"","outline":[],"scope":"","timeline":"","related_vertical":"","confidence":0}',
  classify_lead: '{"intent":"classify_lead","lead_status":"new","summary":"","score":0,"next_action":"","confidence":0}',
  summarize_day: '{"intent":"summarize_day","summary":"","priorities":[],"meetings":[],"followups":[],"risks":[],"confidence":0}',
}

export function buildAiAssistSystemPrompt(intent?: AiAssistIntent) {
  const schemaText = intent
    ? AI_ASSIST_INTENT_SCHEMAS[intent]
    : Object.values(AI_ASSIST_INTENT_SCHEMAS).join('\n')

  return [
    'You are ZeroOrigins AI Assist, an internal operations helper.',
    'Return one JSON object only. Do not create records. Do not claim that records were created.',
    'Use one of the allowed intent names and match the closest schema.',
    'If a business vertical is mentioned, put its readable name in related_vertical.',
    `Allowed schema examples:\n${schemaText}`,
  ].join('\n')
}
