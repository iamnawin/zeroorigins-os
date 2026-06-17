'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { captureManualSignal } from '@/lib/radar/actions'

export function AddSignalDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [runAi, setRunAi] = useState(true)

  function reset() {
    setUrl('')
    setTitle('')
    setSummary('')
    setSourceName('')
    setRunAi(true)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setError(null)
    startTransition(async () => {
      const result = await captureManualSignal({
        url: url.trim(),
        title: title.trim() || url.trim(),
        summary: summary.trim() || undefined,
        source_name: sourceName.trim() || undefined,
        run_ai: runAi,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      reset()
      setOpen(false)
      router.push(`/internal/radar/${result.id}`)
      router.refresh()
    })
  }

  return (
    <>
      <span style={{ display: 'contents' }} onClick={() => setOpen(true)}>{children}</span>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Signal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="url">URL <span className="text-destructive">*</span></Label>
            <Input
              id="url"
              type="url"
              placeholder="https://..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title <span className="text-xs text-muted-foreground">(optional — defaults to URL)</span></Label>
            <Input
              id="title"
              placeholder="What is this signal about?"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="summary">Summary <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="summary"
              placeholder="Brief context about this signal..."
              rows={2}
              value={summary}
              onChange={e => setSummary(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source_name">Source name <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <Input
              id="source_name"
              placeholder="e.g. TechCrunch, LinkedIn, Newsletter"
              value={sourceName}
              onChange={e => setSourceName(e.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={runAi}
              onChange={e => setRunAi(e.target.checked)}
              className="rounded"
            />
            Auto-classify with AI
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!url.trim() || isPending}>
              {isPending ? 'Adding…' : 'Add Signal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
