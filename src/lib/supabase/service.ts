import 'server-only'

import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  if (/[^\x20-\x7E]/.test(key)) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY contains non-ASCII characters. Replace it in Vercel with the raw Supabase service_role key.')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}
