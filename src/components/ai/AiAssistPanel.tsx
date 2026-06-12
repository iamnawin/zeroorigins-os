'use client'

import { useState, useTransition } from 'react'
import { Bot, Check, Sparkles, X } from 'lucide-react'
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
import { AI_ASSIST_QUICK_ACTIONS } from '@/lib/ai/assist-intents'
import { confirmAiAssistDraft, createAiAssistDraft } from '@/lib/actions/ai-assist'
import type { AiAssistIntent } from '@/types'

type DraftState = {
  id: string
  output: Record<string, unknown>
}

export function AiAssistPanel({ embedded = false }: { embedded?: boolean }) {
  const [inputText, setInputText] = useState('')
  const [intent, setIntent] = useState<AiAssistIntent | undefined>()
  const [draft, setDraft] = useState<DraftState | null>(null)
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
      if (result.data) setDraft(result.data)
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
      setInputText('')
      setIntent(undefined)
    })
  }

  const content = (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {AI_ASSIST_QUICK_ACTIONS.map(action => (
          <button
            key={action.intent}
            type="button"
            onClick={() => setIntent(action.intent)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              intent === action.intent
                ? 'border-zo-purple bg-zo-purple/15 text-zo-purple-2'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>

      <Textarea
        value={inputText}
        onChange={event => setInputText(event.target.value)}
        rows={embedded ? 3 : 5}
        placeholder="Ask ZeroOrigins AI to create a task, schedule a meeting, summarize an email, or draft a follow-up..."
      />

      <Button type="button" onClick={createDraft} disabled={isPending || !inputText.trim()} className="w-full">
        <Sparkles className="mr-2 h-4 w-4" />
        {isPending ? 'Drafting...' : 'Create Draft'}
      </Button>

      {draft && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Structured draft</p>
            <button type="button" onClick={() => setDraft(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-background p-3 text-xs text-muted-foreground">
            {JSON.stringify(draft.output, null, 2)}
          </pre>
          <Button type="button" onClick={confirmDraft} disabled={isPending} className="mt-3 w-full" variant="outline">
            <Check className="mr-2 h-4 w-4" />
            Review OK - Create Record
          </Button>
        </div>
      )}

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
    </div>
  )

  if (embedded) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-zo-purple" />
          <p className="text-sm font-semibold">AI Assist</p>
        </div>
        {content}
      </div>
    )
  }

  return (
    <Sheet>
      <SheetTrigger className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg">
        <Bot className="h-4 w-4" />
        AI Assist
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>AI Assist</SheetTitle>
          <SheetDescription>Draft tasks, meetings, replies, proposals, and follow-ups. Records are created only after confirmation.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">{content}</div>
      </SheetContent>
    </Sheet>
  )
}
