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

async function runIngest(request: Request): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await ingestAllRssSources()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return runIngest(request)
}

export async function POST(request: Request) {
  return runIngest(request)
}
