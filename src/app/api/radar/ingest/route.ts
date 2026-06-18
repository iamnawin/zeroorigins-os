import { NextResponse } from 'next/server'
import { ingestAllRssSources } from '@/lib/radar/rss-ingest'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  try {
    const result = await ingestAllRssSources()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
