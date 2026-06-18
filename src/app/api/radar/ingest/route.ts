import { NextResponse } from 'next/server'
import { ingestAllRssSources } from '@/lib/radar/rss-ingest'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const userAgent = request.headers.get('user-agent') ?? ''

  const hasValidSecret = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`
  const isVercelCron = userAgent.includes('vercel-cron/1.0')

  return hasValidSecret || isVercelCron
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object') {
    const typed = error as { message?: string; details?: string; hint?: string; code?: string }
    const parts = [typed.message, typed.details, typed.hint, typed.code].filter(Boolean)
    if (parts.length) return parts.join(' ')
    try {
      return JSON.stringify(error)
    } catch {
      return Object.prototype.toString.call(error)
    }
  }
  return String(error)
}

async function runIngest(request: Request): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await ingestAllRssSources()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('Radar RSS ingest failed', error)
    return NextResponse.json({ ok: false, error: formatError(error) }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return runIngest(request)
}

export async function POST(request: Request) {
  return runIngest(request)
}
