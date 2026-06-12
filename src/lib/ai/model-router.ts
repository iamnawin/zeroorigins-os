export type AiTask =
  | 'classify_expense'
  | 'extract_bill'
  | 'summarize_meeting'
  | 'draft_next_action'
  | 'proposal_strategy'
  | 'crm_planning'
  | 'complex_reasoning'

export type ModelTier = 'cheap' | 'standard' | 'strong'

export type ModelChoice = {
  provider: 'together'
  model: string
  tier: ModelTier
  reason: string
}

const TASK_MODEL_MAP: Record<AiTask, ModelChoice> = {
  classify_expense: {
    provider: 'together',
    model: 'openai/gpt-oss-20b',
    tier: 'cheap',
    reason: 'Short classification with a constrained label set should use the cheapest reliable model.',
  },
  extract_bill: {
    provider: 'together',
    model: 'Qwen/Qwen3.5-9B',
    tier: 'cheap',
    reason: 'Invoice amount, vendor, date, and status extraction needs structured output but not deep reasoning.',
  },
  summarize_meeting: {
    provider: 'together',
    model: 'Qwen/Qwen3.5-9B',
    tier: 'cheap',
    reason: 'CRM meeting summaries are routine internal text compression.',
  },
  draft_next_action: {
    provider: 'together',
    model: 'Qwen/Qwen3.5-9B',
    tier: 'cheap',
    reason: 'Next-action drafts are lightweight assistive CRM suggestions.',
  },
  proposal_strategy: {
    provider: 'together',
    model: 'openai/gpt-oss-120b',
    tier: 'strong',
    reason: 'Proposal strategy affects sales quality and benefits from stronger reasoning.',
  },
  crm_planning: {
    provider: 'together',
    model: 'openai/gpt-oss-120b',
    tier: 'strong',
    reason: 'Operating-system planning crosses records and tradeoffs, so use a stronger model.',
  },
  complex_reasoning: {
    provider: 'together',
    model: 'deepseek-ai/DeepSeek-V4-Pro',
    tier: 'strong',
    reason: 'Reserve deep reasoning for hard analysis where cheap routing is likely to be false economy.',
  },
}

export function chooseTogetherModel(task: AiTask): ModelChoice {
  return TASK_MODEL_MAP[task]
}

export function getTogetherBaseUrl() {
  return 'https://api.together.ai/v1'
}
