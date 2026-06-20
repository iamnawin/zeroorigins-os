'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireInternalUser } from '@/lib/actions/internal-resources'

type NotificationActionResult = {
  ok?: boolean
  error?: string
}

function toResult(error: unknown): NotificationActionResult {
  if (error instanceof Error) return { error: error.message }
  return { error: 'Notification action failed.' }
}

function revalidateNotifications() {
  revalidatePath('/internal')
  revalidatePath('/internal/control-room')
  revalidatePath('/internal/tasks')
}

export async function markNotificationRead(id: string): Promise<NotificationActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { error } = await supabase
      .from('notification_events')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    revalidateNotifications()
    return { ok: true }
  } catch (error) {
    return toResult(error)
  }
}

export async function markAllNotificationsRead(): Promise<NotificationActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { error } = await supabase
      .from('notification_events')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('status', 'unread')

    if (error) throw error
    revalidateNotifications()
    return { ok: true }
  } catch (error) {
    return toResult(error)
  }
}

export async function dismissNotification(id: string): Promise<NotificationActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { error } = await supabase
      .from('notification_events')
      .update({ status: 'dismissed', read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    revalidateNotifications()
    return { ok: true }
  } catch (error) {
    return toResult(error)
  }
}
