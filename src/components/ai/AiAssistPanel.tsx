'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Check, Mic, MicOff, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ZO_AGENT_QUICK_ACTIONS, zoAgentButtonLabel } from '@/lib/ai/assist-intents'
import { confirmAiAssistDraft, createAiAssistDraft } from '@/lib/actions/ai-assist'
import { cn } from '@/lib/utils'
import { AiDraftReviewCard } from './AiDraftReviewCard'
import type { AiAssistIntent, ZoAgentOutput } from '@/types'

type DraftState = {
  id: string
  output: ZoAgentOutput
}

type VoiceState = 'idle' | 'unavailable'

function VoiceButton() {
  const [state, setState] = useState<VoiceState>('idle')

  function handleClick() {
    setState('unavailable')
    setTimeout(() => setState('idle'), 3000)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        title="Ask by voice"
        aria-label="Voice input"
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-all',
          state === 'unavailable'
            ? 'border-red-500/30 bg-red-500/10 text-red-400'
            : 'border-input bg-background text-muted-foreground hover:border-zo-purple/40 hover:text-zo-purple'
        )}
      >
        {state === 'unavailable' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>
      {state === 'unavailable' && (
        <div className="absolute bottom-full right-0 z-10 mb-2 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-xl">
          Voice coming soon
        </div>
      )}
    </div>
  )
}

export function AiAssistPanel({
  embedded = false,
  showHeader = true,
}: {
  embedded?: boolean
  showHeader?: boolean
}) {
  const router = useRouter()
  const [inputText, setInputText] = useState('')
  const [intent, setIntent] = useState<AiAssistIntent | undefined>()
  const [draft, setDraft] = useState<DraftState | null>(null)
  const [results, setResults] = useState<Array<{ id: string; title: string; subtitle?: string; badge?: string; href?: string }> | undefined>()
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function createDraft() {
    setError('')
    startTransition(async () => {
      const result = await createAiAssistDraft({ inputText, intent })
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.data?.id) {
        setDraft({ id: result.data.id, output: result.data.output })
        setResults(result.data.results)
      }
    })
  }

  function confirmDraft() {
    if (!draft) return
    setError('')
    startTransition(async () => {
      const result = await confirmAiAssistDraft(draft.id, draft.output)
      if (result.error) {
        setError(result.error)
        return
      }
      setDraft(null)
      setResults(undefined)
      setInputText('')
      setIntent(undefined)
      if (result.data?.href) {
        router.push(result.data.href)
      } else {
        router.refresh()
      }
    })
  }

  const buttonLabel = zoAgentButtonLabel(intent)

  const content = (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {ZO_AGENT_QUICK_ACTIONS.map(action => (
          <button
            key={action.intent}
            type="button"
            onClick={() => setIntent(prev => prev === action.intent ? undefined : action.intent)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              intent === action.intent
                ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2'
                : 'border-border text-muted-foreground hover:border-zo-purple/30 hover:text-foreground'
            )}
          >
            {action.label}
          </button>
        ))}
      </div>

      <Textarea
        value={inputText}
        onChange={event => setInputText(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && inputText.trim()) {
            createDraft()
          }
        }}
        rows={embedded ? 4 : 5}
        placeholder="Ask ZO_Agent to create a task, schedule a meeting, draft a proposal, promote an idea, or search apps and sources..."
        className="resize-none text-sm"
      />

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={createDraft}
          disabled={isPending || !inputText.trim()}
          className="flex-1"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isPending ? 'Processing...' : buttonLabel}
        </Button>
        {embedded && <VoiceButton />}
      </div>

      {/* Agent response */}
      {draft && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Agent response</p>
              {draft.output.summary && (
                <p className="mt-0.5 text-xs text-muted-foreground">{draft.output.summary}</p>
              )}
            </div>
            <button type="button" onClick={() => { setDraft(null); setResults(undefined) }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Query results */}
          {results && results.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {results.map(row => (
                <a
                  key={row.id}
                  href={row.href ?? '#'}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/60 px-3 py-2 text-xs hover:border-zo-purple/40"
                >
                  <span className="min-w-0 truncate font-medium">{row.title}</span>
                  {row.badge && <span className="shrink-0 text-muted-foreground">{row.badge}</span>}
                </a>
              ))}
            </div>
          )}

          {/* Typed draft preview for confirmable actions */}
          {draft.output.requires_confirmation && (
            <>
              <AiDraftReviewCard output={draft.output} />
              {draft.output.warnings && draft.output.warnings.length > 0 && (
                <div className="mt-2 space-y-1 rounded-md border border-amber-500/30 bg-amber-500/10 p-2">
                  {draft.output.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-300">{w}</p>
                  ))}
                </div>
              )}
              <Button type="button" onClick={confirmDraft} disabled={isPending} className="mt-3 w-full" variant="outline">
                <Check className="mr-2 h-4 w-4" />
                Confirm &amp; Create Record
              </Button>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  )

  if (embedded) {
    return (
      <div>
        {showHeader && (
          <div className="mb-3 flex items-center gap-2">
            <Bot className="h-4 w-4 text-zo-purple" />
            <p className="text-sm font-semibold">ZO_Agent</p>
          </div>
        )}
        {content}
      </div>
    )
  }

  return (
    <Sheet>
      <SheetTrigger className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg">
        <Bot className="h-4 w-4" />
        ZO_Agent
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>ZO_Agent</SheetTitle>
          <SheetDescription>Draft tasks, meetings, replies, proposals, ideas, and follow-ups. Records are created only after confirmation.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">{content}</div>
      </SheetContent>
    </Sheet>
  )
}
