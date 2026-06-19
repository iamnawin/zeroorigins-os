'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function InternalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 text-center shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-zo-purple">Workspace error</p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">This internal page could not load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The record or page hit a server issue. You can retry without signing out, or move back to a stable workspace page.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" onClick={() => reset()}>
            Retry
          </Button>
          <Link href="/internal/control-room">
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Control Room
            </Button>
          </Link>
          <Link href="/internal/leads">
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Leads
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
