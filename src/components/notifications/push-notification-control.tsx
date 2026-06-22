'use client'

import { useEffect, useState } from 'react'
import { BellRing, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PushState = 'checking' | 'unsupported' | 'default' | 'denied' | 'enabled' | 'error'

export function PushNotificationControl() {
  const [state, setState] = useState<PushState>('checking')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function checkSubscription() {
      if (!supportsPush()) {
        setState('unsupported')
        return
      }

      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        const subscription = await registration.pushManager.getSubscription()
        if (!cancelled) {
          setState(subscription ? 'enabled' : Notification.permission === 'denied' ? 'denied' : 'default')
        }
      } catch {
        if (!cancelled) setState('error')
      }
    }

    void checkSubscription()
    return () => {
      cancelled = true
    }
  }, [])

  async function enable() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
    if (!publicKey || !supportsPush()) {
      setState(publicKey ? 'unsupported' : 'error')
      return
    }

    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'default')
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      const existing = await registration.pushManager.getSubscription()
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const response = await fetch('/api/notifications/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subscription.toJSON(),
          deviceLabel: deviceLabel(),
        }),
      })

      if (!response.ok) {
        await subscription.unsubscribe()
        throw new Error('Subscription persistence failed')
      }

      setState('enabled')
    } catch {
      setState('error')
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    if (!supportsPush()) return

    setBusy(true)
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        setState('default')
        return
      }

      const response = await fetch('/api/notifications/push-subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      })

      if (!response.ok) throw new Error('Subscription disable failed')

      await subscription.unsubscribe()
      setState('default')
    } catch {
      setState('error')
    } finally {
      setBusy(false)
    }
  }

  if (state === 'checking') {
    return <p className="px-3 py-2 text-xs text-muted-foreground">Checking device notifications…</p>
  }

  if (state === 'unsupported') {
    return <p className="px-3 py-2 text-xs text-muted-foreground">Background notifications are not supported on this browser.</p>
  }

  if (state === 'denied') {
    return <p className="px-3 py-2 text-xs text-muted-foreground">Notifications are blocked. Allow them in this site&apos;s Chrome settings.</p>
  }

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground">Device reminders</p>
        <p className="text-[11px] text-muted-foreground">
          {state === 'enabled' ? 'Enabled on this device' : state === 'error' ? 'Could not update this device' : 'Notify when the app is closed'}
        </p>
      </div>
      {state === 'enabled' ? (
        <Button type="button" size="xs" variant="outline" disabled={busy} onClick={disable}>
          <BellOff />
          Disable
        </Button>
      ) : (
        <Button type="button" size="xs" disabled={busy} onClick={enable}>
          <BellRing />
          Enable
        </Button>
      )}
    </div>
  )
}

function supportsPush() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
}

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(window.atob(base64), character => character.charCodeAt(0))
}

function deviceLabel() {
  return /Android/i.test(navigator.userAgent) ? 'Android Chrome' : 'Desktop browser'
}
