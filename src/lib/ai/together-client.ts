import 'server-only'

import { chooseTogetherModel, getTogetherBaseUrl, type AiTask } from './model-router'

export type TogetherMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type TogetherChatInput = {
  task: AiTask
  messages: TogetherMessage[]
  maxTokens?: number
  temperature?: number
}

export type TogetherChatResult = {
  content: string
  model: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

type TogetherResponse = {
  choices?: Array<{
    message?: {
      content?: string
      reasoning?: string
    }
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  error?: {
    message?: string
  }
}

export async function callTogetherChat(input: TogetherChatInput): Promise<TogetherChatResult> {
  const apiKey = process.env.TOGETHER_API_KEY
  if (!apiKey) {
    throw new Error('TOGETHER_API_KEY is missing. Add it in .env.local and Vercel Environment Variables.')
  }

  const choice = chooseTogetherModel(input.task)
  const isGptOss = choice.model.startsWith('openai/gpt-oss')
  const isHybridReasoning = choice.model.startsWith('Qwen/') || choice.model.startsWith('deepseek-ai/')

  // GPT-OSS: requires temperature 1.0, developer role, reasoning_effort
  // Hybrid models (Qwen3.5, DeepSeek): use reasoning.enabled=false to get content
  const messages = isGptOss
    ? input.messages.map(m => m.role === 'system' ? { ...m, role: 'developer' as const } : m)
    : input.messages

  const body: Record<string, unknown> = {
    model: choice.model,
    messages,
    max_tokens: input.maxTokens ?? 500,
    temperature: isGptOss ? 1.0 : (input.temperature ?? 0.2),
  }

  if (isGptOss) {
    body.reasoning_effort = 'low'
  } else if (isHybridReasoning) {
    body.reasoning = { enabled: false }
  }

  const response = await fetch(`${getTogetherBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const payload = (await response.json().catch(() => ({}))) as TogetherResponse
  if (!response.ok) {
    throw new Error(payload.error?.message || `Together AI request failed with ${response.status}.`)
  }

  const msg = payload.choices?.[0]?.message
  // Reasoning models may put output in `reasoning` field with empty `content`
  const content = msg?.content?.trim() || msg?.reasoning?.trim() || ''
  if (!content) {
    throw new Error('Together AI returned an empty response.')
  }

  return {
    content,
    model: choice.model,
    promptTokens: payload.usage?.prompt_tokens,
    completionTokens: payload.usage?.completion_tokens,
    totalTokens: payload.usage?.total_tokens,
  }
}

export function parseJsonObject<T extends Record<string, unknown>>(content: string): T {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1] ?? content
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response did not include a JSON object.')
  }

  return JSON.parse(candidate.slice(start, end + 1)) as T
}
