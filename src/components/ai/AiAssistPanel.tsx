'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Mic, MicOff, Sparkles, X } from 'lucide-react'
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
import { runAiAssistCommand, type ZoAgentCommandResponse } from '@/lib/actions/ai-assist'
import { cn } from '@/lib/utils'
import { AiDraftReviewCard } from './AiDraftReviewCard'
import type { AiAssistIntent } from '@/types'

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
  const [response, setResponse] = useState<ZoAgentCommandResponse | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function runCommand() {
    setError('')
    startTransition(async () => {
      const result = await runAiAssistCommand({ inputText, intent })
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.data) {
        setResponse(result.data)
        router.refresh()
      }
    })
  }

  const buttonLabel = zoAgentButtonLabel(intent)

  const content = (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {ZO_AGENT_QUICK_ACTIONS.map(action => (
          <button
            key={action.intent}
            type="button"
            onClick={() => setIntent(prev => prev === action.intent ? undefined : action.intent)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs transition-colors',
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
            runCommand()
          }
        }}
        rows={embedded ? 3 : 5}
        placeholder="Tell Command Center what to create, schedule, log, draft, or search..."
        className="min-h-24 resize-none text-sm leading-5 sm:min-h-28"
      />

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={runCommand}
          disabled={isPending || !inputText.trim()}
          className="flex-1"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isPending ? 'Processing...' : buttonLabel}
        </Button>
        {embedded && <VoiceButton />}
      </div>

      {/* Agent response */}
      {response && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Agent response</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {response.records.length > 0
                  ? `${response.records.length} record${response.records.length === 1 ? '' : 's'} created.`
                  : response.outputs[0]?.summary || 'No record was created from that request.'}
              </p>
            </div>
            <button type="button" onClick={() => setResponse(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Query results */}
          {response.results && response.results.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {response.results.map(row => (
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

          {response.outputs.map((output, index) => (
            <div key={`${output.intent}-${index}`} className="mb-3">
              <AiDraftReviewCard output={output} />
            </div>
          ))}

          {response.warnings.length > 0 && (
            <div className="mt-2 space-y-1 rounded-md border border-amber-500/30 bg-amber-500/10 p-2">
              {response.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-300">{w}</p>
              ))}
            </div>
          )}

          {response.records.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Created records</p>
              {response.records.map(record => (
                <a
                  key={`${record.intent}-${record.id}`}
                  href={record.href ?? '#'}
                  className="flex items-center justify-between gap-3 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 hover:border-emerald-500/40"
                >
                  <span className="min-w-0 truncate font-medium">{record.title}</span>
                  <span className="shrink-0 capitalize text-emerald-300">{record.intent.replace(/_/g, ' ')}</span>
                </a>
              ))}
            </div>
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
            <p className="text-sm font-semibold">Command Center</p>
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
        Command Center
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Command Center</SheetTitle>
          <SheetDescription>Create tasks, meetings, leads, spending records, proposals, ideas, and follow-ups from one instruction.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">{content}</div>
      </SheetContent>
    </Sheet>
  )
}
