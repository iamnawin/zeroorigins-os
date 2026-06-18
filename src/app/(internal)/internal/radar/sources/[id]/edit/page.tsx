'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { updateRadarSource, setRadarSourceActive } from '@/lib/radar/actions'
import { RADAR_TRUST_LEVELS } from '@/types'
import type { RadarSource } from '@/types'

export default function EditRadarSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<RadarSource | null>(null)
  const [id, setId] = useState<string>('')

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [rssUrl, setRssUrl] = useState('')
  const [priority, setPriority] = useState('5')
  const [trustLevel, setTrustLevel] = useState('unknown')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    params.then(async ({ id: resolvedId }) => {
      setId(resolvedId)
      const supabase = createClient()
      const { data } = await supabase
        .from('radar_sources')
        .select('*')
        .eq('id', resolvedId)
        .single()
      if (data) {
        setSource(data as RadarSource)
        setName(data.name)
        setUrl(data.url ?? '')
        setRssUrl(data.rss_url ?? '')
        setPriority(String(data.priority))
        setTrustLevel(data.trust_level)
        setNotes(data.notes ?? '')
      }
    })
  }, [params])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await updateRadarSource(id, {
        name: name.trim(),
        url: url.trim() || undefined,
        rss_url: rssUrl.trim() || undefined,
        priority: parseInt(priority, 10) || 5,
        trust_level: trustLevel as 'unknown',
        notes: notes.trim() || undefined,
      })
      if (result.error) { setError(result.error); return }
      router.push('/internal/radar/sources')
      router.refresh()
    })
  }

  function handleToggleActive() {
    if (!source) return
    startTransition(async () => {
      const result = await setRadarSourceActive(id, !source.is_active)
      if (result.error) { setError(result.error); return }
      router.push('/internal/radar/sources')
      router.refresh()
    })
  }

  if (!source) {
    return <div className="text-sm text-muted-foreground">Loading…</div>
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/internal/radar" className="hover:text-foreground">Radar</Link>
        <span>/</span>
        <Link href="/internal/radar/sources" className="hover:text-foreground">Sources</Link>
        <span>/</span>
        <span className="text-foreground">Edit</span>
      </div>

      <h1 className="text-xl font-bold text-foreground">Edit Source</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="url">Website URL</Label>
          <Input id="url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rss_url">RSS Feed URL</Label>
          <Input id="rss_url" type="url" value={rssUrl} onChange={e => setRssUrl(e.target.value)} placeholder="https://.../feed.xml" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority (1–10)</Label>
            <Input id="priority" type="number" min="1" max="10" value={priority} onChange={e => setPriority(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trust_level">Trust Level</Label>
            <select
              id="trust_level"
              value={trustLevel}
              onChange={e => setTrustLevel(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              {RADAR_TRUST_LEVELS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleToggleActive}
            disabled={isPending}
            className="text-xs"
          >
            {source.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
