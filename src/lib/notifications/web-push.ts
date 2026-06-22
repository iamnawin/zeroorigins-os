import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export type PushPayload = {
  eventId: string
  title: string
  message: string
  severity: string
  actionUrl: string
}

export type PushDeliveryResult = {
  sent: number
  failed: number
  deactivated: number
}

type PushSubscriptionRow = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

let vapidConfigured = false

function configureVapid() {
  if (vapidConfigured) return true

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim()
  const subject = process.env.VAPID_SUBJECT?.trim()
  if (!publicKey || !privateKey || !subject) return false

  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidConfigured = true
  return true
}

export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload,
): Promise<PushDeliveryResult> {
  const result: PushDeliveryResult = { sent: 0, failed: 0, deactivated: 0 }
  if (!configureVapid()) return result

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) {
    console.error('[web-push] Subscription lookup failed', { code: error.code })
    return result
  }

  const subscriptions = (data ?? []) as PushSubscriptionRow[]
  const deliveries = await Promise.allSettled(subscriptions.map(async subscription => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      }, JSON.stringify(payload), {
        urgency: payload.severity === 'urgent' ? 'high' : 'normal',
        TTL: 60 * 60,
      })
      return { sent: true, deactivated: false }
    } catch (error) {
      const statusCode = pushStatusCode(error)
      const expired = statusCode === 404 || statusCode === 410

      if (expired) {
        const { error: deactivateError } = await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('id', subscription.id)

        if (deactivateError) {
          console.error('[web-push] Expired subscription deactivation failed', { code: deactivateError.code })
        }
      }

      console.error('[web-push] Delivery failed', { statusCode })
      return { sent: false, deactivated: expired }
    }
  }))

  for (const delivery of deliveries) {
    if (delivery.status === 'rejected') {
      result.failed += 1
    } else if (delivery.value.sent) {
      result.sent += 1
    } else {
      result.failed += 1
      if (delivery.value.deactivated) result.deactivated += 1
    }
  }

  return result
}

function pushStatusCode(error: unknown) {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) return null
  return typeof error.statusCode === 'number' ? error.statusCode : null
}
