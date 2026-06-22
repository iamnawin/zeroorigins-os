# Background Web Push Notifications Design

## Goal

Deliver task reminders to Android Chrome while ZeroOrigins OS is closed or the device is idle, using the device's normal notification behavior. Keep the existing in-app bell as the notification history and fallback. Preserve a standards-based path to iOS support.

## Scope

This phase includes:

- Android Chrome Web Push subscriptions.
- A service worker that displays reminder notifications and opens the related task.
- Server-side Web Push delivery for due reminder events.
- A Supabase Cron job that invokes reminder processing every minute.
- Subscription management and clear permission state in the internal UI.
- Expired subscription cleanup and idempotent reminder delivery.
- Documentation for VAPID keys, Supabase Vault, and scheduler setup.

This phase does not include custom notification sounds, Telegram, WhatsApp, email fallback, or changes to task visibility. The operating system controls Web Push sound, vibration, battery optimization, and Do Not Disturb behavior.

## Constraints

- The deployment uses Vercel Hobby. Vercel Cron cannot run more than once daily and cannot provide minute-level precision.
- Supabase Cron supports an every-minute job and will call the existing protected Vercel processing route.
- Browser notification permission must be requested from a user gesture.
- Background notifications require HTTPS, an active Push subscription, a service worker, and valid VAPID credentials.
- Delivery is targeted within approximately one minute of the selected reminder time, not at an exact second.
- Android Chrome is the first acceptance target.
- iOS support will reuse the same Web Push protocol. On iOS, the user must add the web app to the Home Screen before enabling push.

## Considered Approaches

### 1. Supabase Cron calling the existing Vercel processor

Recommended. A Supabase Cron job invokes `GET /api/reminders/process` every minute using a bearer secret stored in Supabase Vault. The route retains ownership of reminder processing and Web Push delivery.

Benefits:

- Reuses the existing processor and idempotency model.
- Avoids a Vercel plan upgrade.
- Keeps one application-level implementation of notification creation and delivery.

Trade-off:

- Requires one-time Supabase Cron and Vault configuration.

### 2. Supabase Edge Function

An Edge Function could process due reminders and send Web Push directly.

Rejected because it would duplicate application logic, require a separate deployment surface, and make local verification harder.

### 3. External cron provider

A third-party scheduler could call the existing endpoint every minute.

Rejected because it adds another provider, credential store, and operational dependency when Supabase already supplies scheduling.

## Architecture

### Browser subscription

An authenticated internal user explicitly selects **Enable device notifications**. The client:

1. Registers `/sw.js`.
2. Requests notification permission from the user gesture.
3. Creates a `PushSubscription` using the public VAPID key.
4. Sends the subscription to an authenticated API route.

The server binds the subscription to the authenticated profile. It never accepts a client-supplied user ID.

### Subscription storage

A new `push_subscriptions` table stores:

- `user_id`
- `endpoint`
- `p256dh`
- `auth`
- `user_agent`
- `device_label`
- `is_active`
- timestamps

The endpoint is unique. Row-level security restricts normal users to their own subscriptions. Service-role reminder processing can read and deactivate subscriptions for delivery.

### Reminder scheduling

Supabase Cron runs every minute and calls:

```text
GET https://zeroorigins-os.vercel.app/api/reminders/process
Authorization: Bearer <CRON_SECRET>
```

The URL and secret are stored in Supabase Vault. The existing authenticated `POST` fallback remains available while the app is open, but it is no longer required for background delivery.

The reminder processor continues to:

1. Select scheduled reminders due at or before the current time.
2. Create one idempotent `notification_events` row per reminder.
3. Mark the reminder triggered.

After creating the notification event, it sends a Web Push payload to every active subscription owned by the reminder recipient.

### Push delivery

The payload contains only display and navigation data:

- notification event ID
- title
- message
- severity
- action URL

The private VAPID key remains server-only. A standards-compatible Web Push library performs encryption and delivery. Responses indicating an expired or invalid subscription deactivate that subscription. A failure on one device does not block the notification event or delivery to other devices.

### Service worker

`public/sw.js` handles:

- `push`: parse the payload and call `showNotification()`.
- `notificationclick`: focus an existing ZeroOrigins OS window when possible, otherwise open the exact `action_url`.

The service worker uses the device's normal notification settings. The application will not promise or attempt a custom sound.

### User interface

The notification bell includes a compact device-notification state:

- **Enable device notifications** when permission has not been granted.
- **Enabled on this device** when an active subscription exists.
- Actionable guidance when permission is blocked.
- **Disable on this device** to deactivate and unsubscribe the current endpoint.

Permission is never requested automatically on page load.

## Security

- Subscription APIs require an authenticated, active internal user.
- User identity comes from the server session.
- RLS prevents users from reading or modifying other users' subscriptions.
- The private VAPID key and `CRON_SECRET` are never exposed to client code.
- Supabase Vault stores the scheduled request URL and bearer secret.
- Push payloads avoid sensitive record content beyond the task title and reminder message already visible to the recipient.
- Cron processing remains idempotent through the existing reminder/event uniqueness constraint.

## Error Handling

- Unsupported browsers retain the in-app bell and show a clear compatibility message.
- Denied permission shows browser-settings guidance without repeatedly prompting.
- Subscription save failures leave the device disabled and display a retryable error.
- HTTP 404 or 410 from the push service deactivates the subscription.
- Transient push failures are logged without reverting a created notification event.
- Cron invocation and processor failures remain visible in Supabase Cron history and Vercel function logs.

## Testing

Automated contract and unit coverage will verify:

- Migration columns, indexes, and RLS policies.
- Authenticated subscription creation and deletion boundaries.
- Web Push payload construction.
- Expired subscription deactivation.
- A push failure does not prevent processing remaining subscriptions.
- Service-worker push and click handlers exist and use the action URL.
- Cron setup documentation uses an every-minute schedule and Vault secrets.
- Existing reminder idempotency continues to pass.

Manual Android Chrome acceptance:

1. Sign in on Android Chrome over HTTPS.
2. Enable device notifications from the bell.
3. Create a task reminder two or more minutes ahead.
4. Close Chrome or lock the phone.
5. Confirm a system notification arrives approximately within one minute of the reminder time and uses the phone's configured notification behavior.
6. Tap it and confirm the exact task opens after authentication.
7. Disable notifications on the device and confirm later reminders do not reach it.

## Deployment Configuration

Vercel environment variables:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT=mailto:support@zeroorigins.in`
- `CRON_SECRET`

Supabase configuration:

- Enable Cron and `pg_net` if not already enabled.
- Store the production app URL and `CRON_SECRET` in Vault.
- Schedule the protected processor endpoint with `* * * * *`.

The existing email or inbox synchronization schedule, if configured outside this repository, remains unchanged. Reminder processing uses a separately named cron job.

## Acceptance Criteria

- An Android Chrome user can enable and disable notifications for that device.
- A due task reminder creates exactly one notification event.
- With the app closed or phone idle, an enabled Android device receives a system notification approximately within one minute.
- Tapping the notification opens the related task.
- Invalid subscriptions are deactivated automatically.
- The notification bell continues to show the same event history.
- No Vercel plan upgrade is required.
- Existing email synchronization scheduling is not changed.
