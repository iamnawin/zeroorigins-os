self.addEventListener('push', event => {
  const payload = event.data?.json() ?? {}
  const actionUrl = payload.actionUrl || '/internal/control-room'

  event.waitUntil(self.registration.showNotification(payload.title || 'ZeroOrigins OS', {
    body: payload.message || 'A task reminder is due.',
    tag: payload.eventId || actionUrl,
    data: { actionUrl },
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const actionUrl = event.notification.data?.actionUrl || '/internal/control-room'

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin)

    if (existing) {
      await existing.navigate(actionUrl)
      return existing.focus()
    }

    return self.clients.openWindow(actionUrl)
  })())
})
