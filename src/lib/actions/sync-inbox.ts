'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function ignoreSyncSignal(signalId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('sync_signals')
    .update({
      status: 'ignored',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_action: 'ignored',
    })
    .eq('id', signalId)

  revalidatePath('/internal/sync-inbox')
}
