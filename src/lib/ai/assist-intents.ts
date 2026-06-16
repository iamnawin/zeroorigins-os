import type { AiAssistIntent, ZoAgentMode } from '@/types'

export const ZO_AGENT_NAME = 'ZO_Agent'
export const ZO_AGENT_PROVIDER = 'Together AI'

export const ZO_AGENT_QUICK_ACTIONS: { intent: AiAssistIntent; label: string }[] = [
  { intent: 'create_task', label: 'Create task' },
  { intent: 'schedule_meeting', label: 'Schedule meeting' },
  { intent: 'create_spending', label: 'Add spending' },
  { intent: 'draft_reply', label: 'Draft reply' },
  { intent: 'summarize_email', label: 'Summarize email' },
  { intent: 'create_proposal', label: 'Create proposal' },
  { intent: 'create_idea', label: 'Capture idea' },
  { intent: 'promote_idea_to_application', label: 'Promote idea to app' },
  { intent: 'query_emails', label: 'Show emails' },
  { intent: 'query_applications', label: 'Show applications' },
  { intent: 'summarize_today', label: 'Summarize today' },
]

export const ZO_AGENT_BUTTON_LABELS: Record<AiAssistIntent, string> = {
  create_task: 'Generate Task Draft',
  schedule_meeting: 'Generate Meeting Draft',
  create_spending: 'Generate Spending Draft',
  draft_reply: 'Generate Reply Draft',
  summarize_email: 'Summarize Email',
  create_followup: 'Generate Follow-up Draft',
  create_project: 'Generate Project Draft',
  create_proposal: 'Generate Proposal Outline',
  create_idea: 'Capture Idea',
  promote_idea_to_application: 'Generate Application Draft',
  create_application: 'Generate Application Draft',
  query_emails: 'Search Emails',
  query_tasks: 'Search Tasks',
  query_projects: 'Search Projects',
  query_ideas: 'Search Ideas',
  query_applications: 'Search Applications',
  query_verticals: 'Search Verticals',
  find_missing_sources: 'Find Source Gaps',
  update_application_source: 'Generate Source Update Draft',
  sync_repo_details: 'Prepare Source Sync',
  summarize_today: 'Summarize Today',
  unknown: 'Ask ZO_Agent',
}

export function zoAgentButtonLabel(intent?: AiAssistIntent) {
  return intent ? ZO_AGENT_BUTTON_LABELS[intent] : 'Ask ZO_Agent'
}

export const ZO_AGENT_INTENT_MODES: Record<AiAssistIntent, ZoAgentMode> = {
  create_task: 'draft',
  schedule_meeting: 'draft',
  create_spending: 'draft',
  draft_reply: 'draft',
  summarize_email: 'summary',
  create_followup: 'draft',
  create_project: 'draft',
  create_proposal: 'draft',
  create_idea: 'draft',
  promote_idea_to_application: 'draft',
  create_application: 'draft',
  query_emails: 'query',
  query_tasks: 'query',
  query_projects: 'query',
  query_ideas: 'query',
  query_applications: 'query',
  query_verticals: 'query',
  find_missing_sources: 'query',
  update_application_source: 'draft',
  sync_repo_details: 'draft',
  summarize_today: 'summary',
  unknown: 'summary',
}

// Draft intents that can create a record after explicit user confirmation.
export const ZO_AGENT_CONFIRMABLE_INTENTS: AiAssistIntent[] = [
  'create_task', 'schedule_meeting', 'create_spending', 'create_followup', 'create_project', 'create_proposal',
  'create_idea', 'promote_idea_to_application', 'create_application', 'update_application_source',
]

const INTENT_SCHEMAS: Partial<Record<AiAssistIntent, string>> = {
  create_task: '{"intent":"create_task","mode":"draft","title":"","summary":"","confidence":0,"requires_confirmation":true,"draft":{"task_title":"","description":"","priority":"low | normal | high | urgent","due_date":"YYYY-MM-DD","assigned_to":"","related_vertical":"","related_project":"","related_application":""},"next_actions":[],"warnings":[]}',
  schedule_meeting: '{"intent":"schedule_meeting","mode":"draft","title":"","summary":"","confidence":0,"requires_confirmation":true,"draft":{"meeting_title":"","date":"YYYY-MM-DD","start_time":"HH:MM","end_time":"HH:MM","attendees":[],"agenda":[],"related_vertical":"","related_application":"","notes":""},"next_actions":[],"warnings":[]}',
  create_spending: '{"intent":"create_spending","mode":"draft","title":"","summary":"","confidence":0,"requires_confirmation":true,"draft":{"description":"","amount":0,"currency":"INR","category":"software | infrastructure | ai_api | marketing | contractor | payroll | travel | office | tax | hosting | domain | operations | project_cost | other","type":"expense","vendor_name":"","paid_by":"","status":"paid | due | overdue | planned","date":"YYYY-MM-DD","notes":""},"next_actions":[],"warnings":[]}',
  draft_reply: '{"intent":"draft_reply","mode":"draft","title":"","summary":"","confidence":0,"requires_confirmation":true,"draft":{"recipient":"","subject":"","message":"","tone":"professional"},"next_actions":[],"warnings":[]}',
  summarize_email: '{"intent":"summarize_email","mode":"summary","title":"","summary":"","confidence":0,"requires_confirmation":false,"draft":{"sender":"","action_items":[],"urgency":"normal"},"next_actions":[],"warnings":[]}',
  create_followup: '{"intent":"create_followup","mode":"draft","title":"","summary":"","confidence":0,"requires_confirmation":true,"draft":{"channel":"email","recipient":"","subject":"","message":"","related_lead":"","related_vertical":""},"next_actions":[],"warnings":[]}',
  create_project: '{"intent":"create_project","mode":"draft","title":"","summary":"","confidence":0,"requires_confirmation":true,"draft":{"project_title":"","description":"","priority":"normal","related_vertical":"","start_date":"","target_date":""},"next_actions":[],"warnings":[]}',
  create_proposal: '{"intent":"create_proposal","mode":"draft","title":"","summary":"","confidence":0,"requires_confirmation":true,"draft":{"proposal_title":"","client_or_vertical":"","related_application":"","problem_statement":"","proposed_solution":"","scope":[],"deliverables":[],"timeline":"","commercials":"","next_step":""},"next_actions":[],"warnings":[]}',
  create_idea: '{"intent":"create_idea","mode":"draft","title":"","summary":"","confidence":0,"requires_confirmation":true,"draft":{"idea_title":"","description":"","vertical":"","source":"ZO_Agent","status":"raw","priority":"normal","local_folder_path":"","next_action":""},"next_actions":[],"warnings":[]}',
  promote_idea_to_application: '{"intent":"promote_idea_to_application","mode":"draft","title":"","summary":"","confidence":0,"requires_confirmation":true,"draft":{"source_idea":"","application_name":"","vertical":"","description":"","stage":"prototype","status":"active","repo_url":"","local_folder_path":"","docs_url":"","docs_folder_path":"","website_url":"","deployment_url":"","notes":""},"next_actions":["Create application record","Link source idea","Update idea status to promoted_to_application"],"warnings":[]}',
  create_application: '{"intent":"create_application","mode":"draft","title":"","summary":"","confidence":0,"requires_confirmation":true,"draft":{"application_name":"","vertical":"","description":"","stage":"concept","status":"active","type":"application","repo_url":"","local_folder_path":"","docs_url":"","docs_folder_path":"","website_url":"","deployment_url":"","database_url":"","n8n_workflow_url":"","figma_url":"","tech_stack":[],"notes":""},"next_actions":[],"warnings":[]}',
  query_emails: '{"intent":"query_emails","mode":"query","title":"","summary":"","confidence":0,"requires_confirmation":false,"query":{"date_range":"today | this_week | custom","category":"","priority":"","related_vertical":"","status":""},"next_actions":[],"warnings":[]}',
  query_applications: '{"intent":"query_applications","mode":"query","title":"","summary":"","confidence":0,"requires_confirmation":false,"query":{"stage":"","status":"","vertical":"","missing_source":""},"next_actions":[],"warnings":[]}',
  find_missing_sources: '{"intent":"find_missing_sources","mode":"query","title":"","summary":"","confidence":0,"requires_confirmation":false,"query":{"scope":"applications","missing":"repo | local_folder | docs | deployment | website | all"},"next_actions":[],"warnings":[]}',
  update_application_source: '{"intent":"update_application_source","mode":"draft","title":"","summary":"","confidence":0,"requires_confirmation":true,"draft":{"application_name":"","source_type":"repo | local_folder | docs | deployment | website | figma | n8n | supabase | other","source_url":"","local_path":"","notes":""},"next_actions":["Confirm source details","Save to application source registry"],"warnings":[]}',
  summarize_today: '{"intent":"summarize_today","mode":"summary","title":"","summary":"","confidence":0,"requires_confirmation":false,"query":{"date_range":"today"},"next_actions":[],"warnings":[]}',
}

const GENERIC_QUERY_SCHEMA = (intent: string) =>
  `{"intent":"${intent}","mode":"query","title":"","summary":"","confidence":0,"requires_confirmation":false,"query":{"status":"","related_vertical":""},"next_actions":[],"warnings":[]}`

function schemaFor(intent: AiAssistIntent): string {
  return INTENT_SCHEMAS[intent] ?? GENERIC_QUERY_SCHEMA(intent)
}

const BEHAVIOR_EXAMPLES = `Examples of correct intent resolution:
- "what are the emails today?" -> intent query_emails (NEVER create_task)
- "create task for Ankita to check IgnAIte brochure tomorrow" -> intent create_task
- "schedule meeting with Srikar this weekend about AIWithNoBrain Labs" -> intent schedule_meeting
- "add spending 10000 INR on company registration paid by naveen" -> intent create_spending, draft.amount 10000, draft.currency "INR", draft.description "company registration", draft.paid_by "naveen"
- "gmail spend 5000 inr paid by srikar" -> intent create_spending, draft.amount 5000, draft.currency "INR", draft.description "gmail", draft.category "software", draft.paid_by "srikar"
- "capture an idea for EpicsToYou AI video generator" -> intent create_idea, draft.vertical "EpicsToYou"
- "promote the tested EpicsToYou video generator idea to application" -> intent promote_idea_to_application
- "create project proposal for IgnAIte launch" -> intent create_proposal
- "show applications" or "show production-ready apps" -> intent query_applications (query.stage "production_ready" when asked)
- "what apps are missing repo links?" -> intent find_missing_sources, query.missing "repo"
- "add local folder D:\\AI-Workspace\\Repos\\orgtrace to OrgTrace" -> intent update_application_source, draft.application_name "OrgTrace", draft.source_type "local_folder", draft.local_path "D:\\AI-Workspace\\Repos\\orgtrace"
- "summarize today" -> intent summarize_today
- If nothing fits, use intent "unknown" with a helpful summary. Do not force create_task.`

export function buildZoAgentSystemPrompt(options: {
  intent?: AiAssistIntent
  verticalNames?: string[]
  today?: string
}) {
  const { intent, verticalNames = [], today } = options
  const intentLine = intent
    ? `The user pre-selected the intent "${intent}". Use exactly this intent and its schema.`
    : `Infer the single best intent from the user's text. Allowed intents: ${Object.keys(ZO_AGENT_INTENT_MODES).join(', ')}.`
  const schemaText = intent
    ? schemaFor(intent)
    : Object.values(INTENT_SCHEMAS).join('\n')

  return [
    `You are ${ZO_AGENT_NAME}, the operations assistant inside ZeroOrigins OS.`,
    'You are not a chatbot. You convert short operator requests into one structured JSON object.',
    'Return ONE JSON object only. No prose, no markdown, no code fences. NEVER return multiple JSON objects.',
    'If the user mentions multiple items (e.g. two spendings), handle only the FIRST one and list the rest in the "warnings" array as reminders to add separately.',
    'Never claim that any record was created. Records are only created after the user confirms a draft.',
    'For create/update intents set requires_confirmation to true and mode "draft".',
    'For query intents set requires_confirmation to false and mode "query". For summaries use mode "summary".',
    'confidence is a number between 0 and 1.',
    'Mental model: Business Verticals are brands/business lines. Ideas are raw concepts. Applications are built products/repos. Verticals (AIWithNoBrain, AIWithNoBrain Labs, IgnAIte, EpicsToYou) are NOT ideas.',
    verticalNames.length ? `Known business verticals: ${verticalNames.join(', ')}. When one is mentioned, put its exact name in related_vertical / vertical.` : '',
    today ? `Today's date is ${today}. Resolve relative dates ("tomorrow", "this weekend") to YYYY-MM-DD.` : '',
    intentLine,
    BEHAVIOR_EXAMPLES,
    `Schema(s) to follow:\n${schemaText}`,
  ].filter(Boolean).join('\n')
}
