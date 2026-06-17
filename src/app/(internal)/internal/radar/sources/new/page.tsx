'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createRadarSource } from '@/lib/radar/actions'
import { RADAR_SOURCE_TYPES, RADAR_TRUST_LEVELS } from '@/types'

export default function NewRadarSourcePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [sourceType, setSourceType] = useState<string>('website')
  const [url, setUrl] = useState('')
  const [rssUrl, setRssUrl] = useState('')
  const [country, setCountry] = useState('')
  const [priority, setPriority] = useState('5')
  const [trustLevel, setTrustLevel] = useState<string>('unknown')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setError(null)
    startTransition(async () => {
      const result = await createRadarSource({
        name: name.trim(),
        source_type: sourceType as 'website',
        url: url.trim() || undefined,
        rss_url: rssUrl.trim() || undefined,
        country: country.trim() || undefined,
        priority: parseInt(priority, 10) || 5,
        trust_level: trustLevel as 'unknown',
        notes: notes.trim() || undefined,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      router.push('/internal/radar/sources')
      router.refresh()
    })
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/internal/radar" className="hover:text-foreground">Radar</Link>
        <span>/</span>
        <Link href="/internal/radar/sources" className="hover:text-foreground">Sources</Link>
        <span>/</span>
        <span className="text-foreground">New</span>
      </div>

      <h1 className="text-xl font-bold text-foreground">Add Signal Source</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. TechCrunch AI" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="source_type">Source Type</Label>
          <select
            id="source_type"
            value={sourceType}
            onChange={e => setSourceType(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            {RADAR_SOURCE_TYPES.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="url">URL</Label>
          <Input id="url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rss_url">RSS URL</Label>
          <Input id="rss_url" type="url" value={rssUrl} onChange={e => setRssUrl(e.target.value)} placeholder="https://.../feed.xml" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={country} onChange={e => setCountry(e.target.value)} placeholder="IN, US, Global" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority (1–10)</Label>
            <Input id="priority" type="number" min="1" max="10" value={priority} onChange={e => setPriority(e.target.value)} />
          </div>
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

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any context about this source..." />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || isPending}>
            {isPending ? 'Creating…' : 'Create Source'}
          </Button>
        </div>
      </form>
    </div>
  )
}
