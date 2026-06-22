# Background Web Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver task reminders as Android Chrome system notifications while the app is closed, using Supabase Cron for minute-level scheduling on Vercel Hobby.

**Architecture:** The existing reminder processor remains the source of truth. Supabase Cron calls it every minute; the processor creates an idempotent notification event and sends an encrypted Web Push payload to active subscriptions. A client control registers a service worker and saves the current device subscription through authenticated Route Handlers.

**Tech Stack:** Next.js 16.2 Route Handlers and Client Components, React 19, Supabase/Postgres RLS and Cron, Service Worker Push API, `web-push`, Node contract tests, pnpm.

---

## File Structure

- Create `supabase/migrations/026_web_push_notifications.sql` for subscription persistence, RLS, and indexes.
- Create `src/app/api/notifications/push-subscription/route.ts` for authenticated subscribe/unsubscribe operations.
- Create `src/lib/notifications/web-push.ts` for server-only VAPID setup and per-user delivery.
- Create `src/components/notifications/push-notification-control.tsx` for browser capability, permission, registration, and device state.
- Create `public/sw.js` for background push display and click navigation.
- Modify `src/lib/notifications/reminders.ts` to invoke push delivery after event creation.
- Modify `src/app/api/reminders/process/route.ts` to require the Node runtime and report push counts.
- Modify `src/components/notifications/notification-bell.tsx` to expose the device control.
- Modify `scripts/test-notification-engine-contract.mjs` for the new security and delivery contracts.
- Modify `scripts/lib/migration-sentinels.mjs` to require migration 026.
- Modify `docs/reminder-notification-engine.md` and `.env.local.example` for deployment setup.
- Modify `package.json` and `pnpm-lock.yaml` for `web-push` and its TypeScript declarations.

### Task 1: Lock the persistence and service-worker contract

**Files:**
- Modify: `scripts/test-notification-engine-contract.mjs`
- Modify: `scripts/lib/migration-sentinels.mjs`
- Create: `supabase/migrations/026_web_push_notifications.sql`
- Create: `public/sw.js`

- [ ] **Step 1: Add failing contract assertions**

Extend `scripts/test-notification-engine-contract.mjs` with:

```js
const pushMigration = assertFile('supabase/migrations/026_web_push_notifications.sql')
const serviceWorker = assertFile('public/sw.js')

assert.match(pushMigration, /create table if not exists push_subscriptions/)
assert.match(pushMigration, /endpoint text not null unique/)
assert.match(pushMigration, /p256dh text not null/)
assert.match(pushMigration, /auth text not null/)
assert.match(pushMigration, /alter table push_subscriptions enable row level security/)
assert.match(pushMigration, /user_id = auth\.uid\(\)/)
assert.match(pushMigration, /service_role/)

assert.match(serviceWorker, /addEventListener\(['"]push['"]/)
assert.match(serviceWorker, /showNotification/)
assert.match(serviceWorker, /addEventListener\(['"]notificationclick['"]/)
assert.match(serviceWorker, /clients\.openWindow/)
```

Add this sentinel to `scripts/lib/migration-sentinels.mjs`:

```js
{ migration: '026_web_push_notifications', table: 'push_subscriptions', column: 'endpoint' },
```

- [ ] **Step 2: Run the contract and confirm red**

Run: `pnpm test:notification-engine`

Expected: FAIL because migration 026 and `public/sw.js` do not exist.

- [ ] **Step 3: Add the subscription migration**

Create `supabase/migrations/026_web_push_notifications.sql`:

```sql
create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  device_label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user_active
  on push_subscriptions(user_id, is_active);

drop trigger if exists set_updated_at_push_subscriptions on push_subscriptions;
create trigger set_updated_at_push_subscriptions
  before update on push_subscriptions
  for each row execute function update_updated_at();

alter table push_subscriptions enable row level security;

drop policy if exists "Users can view own push subscriptions" on push_subscriptions;
create policy "Users can view own push subscriptions" on push_subscriptions
  for select using (user_id = auth.uid());

drop policy if exists "Users can insert own push subscriptions" on push_subscriptions;
create policy "Users can insert own push subscriptions" on push_subscriptions
  for insert with check (user_id = auth.uid());

drop policy if exists "Users can update own push subscriptions" on push_subscriptions;
create policy "Users can update own push subscriptions" on push_subscriptions
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own push subscriptions" on push_subscriptions;
create policy "Users can delete own push subscriptions" on push_subscriptions
  for delete using (user_id = auth.uid());

grant select, insert, update, delete on push_subscriptions to authenticated;
grant all on push_subscriptions to service_role;
```

- [ ] **Step 4: Add the service worker**

Create `public/sw.js`:

```js
self.addEventListener('push', event => {
  const payload = event.data?.json() ?? {}
  const actionUrl = payload.actionUrl || '/internal/control-room'

  event.waitUntil(self.registration.showNotification(payload.title || 'ZeroOrigins OS', {
    body: payload.message || 'A task reminder is due.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
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
```

Before committing, use an existing real icon path returned by `rg --files public`; if `/icon-192.png` does not exist, omit `icon` and `badge` rather than adding unrelated artwork.

- [ ] **Step 5: Run the contract and migration checks**

Run: `pnpm test:notification-engine`

Expected: PASS.

Run: `pnpm test:crm-foundation`

Expected: PASS with migration 026 recognized.

- [ ] **Step 6: Commit**

Commit only the migration, service worker, and contract changes using a Lore-format message whose intent line is `Keep notification devices bound to their authenticated owners`.

### Task 2: Add authenticated subscription management

**Files:**
- Create: `src/app/api/notifications/push-subscription/route.ts`
- Modify: `scripts/test-notification-engine-contract.mjs`

- [ ] **Step 1: Add failing route assertions**

Add:

```js
const pushRoute = assertFile('src/app/api/notifications/push-subscription/route.ts')
assert.match(pushRoute, /export async function POST/)
assert.match(pushRoute, /export async function DELETE/)
assert.match(pushRoute, /auth\.getUser\(\)/)
assert.match(pushRoute, /INTERNAL_ROLES\.includes/)
assert.match(pushRoute, /user_id:\s*user\.id/)
assert.match(pushRoute, /\.eq\(['"]user_id['"],\s*user\.id\)/)
assert.doesNotMatch(pushRoute, /user_id:\s*body\./)
```

- [ ] **Step 2: Run red**

Run: `pnpm test:notification-engine`

Expected: FAIL because the subscription route does not exist.

- [ ] **Step 3: Implement the Route Handler**

Create a Node Route Handler that:

```ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SubscriptionBody = {
  endpoint?: unknown
  keys?: { p256dh?: unknown; auth?: unknown }
  deviceLabel?: unknown
}
```

Both handlers must create the authenticated Supabase client, call `auth.getUser()`, read the profile, and require `status === 'active'` plus an `INTERNAL_ROLES` role.

`POST` must validate non-empty string `endpoint`, `keys.p256dh`, and `keys.auth`, then upsert:

```ts
{
  user_id: user.id,
  endpoint,
  p256dh,
  auth,
  user_agent: request.headers.get('user-agent'),
  device_label: deviceLabel || null,
  is_active: true,
}
```

Use `{ onConflict: 'endpoint' }` and return `{ ok: true }`. `DELETE` must accept `{ endpoint }` and update `is_active: false` with both `.eq('endpoint', endpoint)` and `.eq('user_id', user.id)`. Return 400 for malformed bodies, 401 for no session, 403 for inactive/external profiles, and 500 for database failures.

- [ ] **Step 4: Verify**

Run: `pnpm test:notification-engine`

Expected: PASS.

Run: `pnpm exec eslint 'src/app/api/notifications/push-subscription/route.ts'`

Expected: PASS with no errors.

- [ ] **Step 5: Commit**

Commit the route and test with Lore intent `Prevent notification subscriptions from crossing account boundaries`.

### Task 3: Add the Android notification control

**Files:**
- Create: `src/components/notifications/push-notification-control.tsx`
- Modify: `src/components/notifications/notification-bell.tsx`
- Modify: `scripts/test-notification-engine-contract.mjs`

- [ ] **Step 1: Add failing client assertions**

Add:

```js
const pushControl = assertFile('src/components/notifications/push-notification-control.tsx')
assert.match(pushControl, /^['"]use client['"]/)
assert.match(pushControl, /Notification\.requestPermission\(\)/)
assert.match(pushControl, /navigator\.serviceWorker\.register\(['"]\/sw\.js['"]\)/)
assert.match(pushControl, /pushManager\.subscribe/)
assert.match(pushControl, /applicationServerKey/)
assert.match(pushControl, /\/api\/notifications\/push-subscription/)
assert.match(pushControl, /method:\s*['"]DELETE['"]/)
assert.match(bell, /PushNotificationControl/)
```

- [ ] **Step 2: Run red**

Run: `pnpm test:notification-engine`

Expected: FAIL because the client control does not exist.

- [ ] **Step 3: Implement the control**

Create a client component with state `checking | unsupported | default | denied | enabled | error`. On mount, check all of:

```ts
'serviceWorker' in navigator
'PushManager' in window
'Notification' in window
```

Register `/sw.js`, call `registration.pushManager.getSubscription()`, and set enabled only when a subscription exists.

The enable button handler must:

1. Read `process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
2. Call `Notification.requestPermission()` from the click handler.
3. Convert the URL-safe base64 key to `Uint8Array`.
4. Call `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.
5. POST `subscription.toJSON()` and a short Android/desktop device label to the authenticated route.
6. Unsubscribe locally if server persistence fails.

The disable handler must DELETE the endpoint first, then call `subscription.unsubscribe()`. Render compact buttons and blocked-permission guidance; never prompt automatically.

- [ ] **Step 4: Mount the control in the notification menu**

Import `PushNotificationControl` into `notification-bell.tsx` and render it above the final separator and Tasks link. Keep the existing bell polling and in-app sound fallback unchanged.

- [ ] **Step 5: Verify**

Run: `pnpm test:notification-engine`

Expected: PASS.

Run: `pnpm exec eslint 'src/components/notifications/push-notification-control.tsx' 'src/components/notifications/notification-bell.tsx'`

Expected: PASS with no errors.

- [ ] **Step 6: Commit**

Commit with Lore intent `Let each signed-in device opt into background reminders explicitly`.

### Task 4: Send Web Push from reminder processing

**Files:**
- Create: `src/lib/notifications/web-push.ts`
- Modify: `src/lib/notifications/reminders.ts`
- Modify: `src/app/api/reminders/process/route.ts`
- Modify: `scripts/test-notification-engine-contract.mjs`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Install the server dependency**

Run:

```powershell
pnpm add web-push
pnpm add -D @types/web-push
```

Expected: `package.json` and `pnpm-lock.yaml` update without creating another lockfile.

- [ ] **Step 2: Add failing sender assertions**

Add:

```js
const pushSender = assertFile('src/lib/notifications/web-push.ts')
assert.match(pushSender, /import ['"]server-only['"]/)
assert.match(pushSender, /setVapidDetails/)
assert.match(pushSender, /sendNotification/)
assert.match(pushSender, /push_subscriptions/)
assert.match(pushSender, /statusCode === 404/)
assert.match(pushSender, /statusCode === 410/)
assert.match(reminderService, /sendPushToUser/)
assert.match(processRoute, /runtime\s*=\s*['"]nodejs['"]/)
```

- [ ] **Step 3: Run red**

Run: `pnpm test:notification-engine`

Expected: FAIL because the sender does not exist.

- [ ] **Step 4: Implement the server-only sender**

Create `web-push.ts` with:

```ts
import 'server-only'
import webpush from 'web-push'

export type PushPayload = {
  eventId: string
  title: string
  message: string
  severity: string
  actionUrl: string
}

export type PushDeliveryResult = { sent: number; failed: number; deactivated: number }
```

Read and trim `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`. If any is absent, return zero counts so in-app processing still succeeds. Configure VAPID once per module.

`sendPushToUser(supabase, userId, payload)` must select active subscriptions for that user, call `webpush.sendNotification()` with `{ endpoint, keys: { p256dh, auth } }`, and use `Promise.allSettled` semantics so one device cannot block another. For failures with status 404 or 410, update only that subscription ID to `is_active: false`. Return aggregate counts and log failures without keys or endpoints.

- [ ] **Step 5: Integrate after event creation**

Change the notification upsert in `processDueReminders` to `.select('id').single()`. After a successful event creation, call:

```ts
await sendPushToUser(supabase, reminder.user_id, {
  eventId: event.id,
  title: task?.title ? `Reminder: ${task.title}` : 'Task reminder',
  message: task?.description || 'A task reminder is due.',
  severity: severityForPriority(priority),
  actionUrl: `/internal/tasks/${reminder.task_id}`,
})
```

Accumulate `pushSent`, `pushFailed`, and `pushDeactivated` in `ProcessDueRemindersResult`. Preserve event creation and reminder status updates even when push delivery fails.

Set `export const runtime = 'nodejs'` in the processor Route Handler because `web-push` uses Node cryptography.

- [ ] **Step 6: Verify sender integration**

Run: `pnpm test:notification-engine`

Expected: PASS.

Run: `pnpm exec eslint 'src/lib/notifications/web-push.ts' 'src/lib/notifications/reminders.ts' 'src/app/api/reminders/process/route.ts'`

Expected: PASS with no errors.

Run: `pnpm build`

Expected: Next.js production build and TypeScript pass.

- [ ] **Step 7: Commit**

Commit with Lore intent `Deliver due reminder events beyond the open application`.

### Task 5: Document and configure minute-level scheduling

**Files:**
- Modify: `.env.local.example`
- Modify: `docs/reminder-notification-engine.md`
- Create: `supabase/configure-reminder-cron.sql`
- Modify: `scripts/test-notification-engine-contract.mjs`

- [ ] **Step 1: Add failing scheduler assertions**

Add:

```js
const cronSetup = assertFile('supabase/configure-reminder-cron.sql')
const envExample = assertFile('.env.local.example')
assert.match(cronSetup, /cron\.schedule/)
assert.match(cronSetup, /['"]\* \* \* \* \*['"]/)
assert.match(cronSetup, /vault\.decrypted_secrets/)
assert.match(cronSetup, /Authorization/)
assert.match(envExample, /NEXT_PUBLIC_VAPID_PUBLIC_KEY/)
assert.match(envExample, /VAPID_PRIVATE_KEY/)
assert.match(envExample, /VAPID_SUBJECT/)
```

- [ ] **Step 2: Run red**

Run: `pnpm test:notification-engine`

Expected: FAIL because the scheduler SQL and environment documentation are absent.

- [ ] **Step 3: Add idempotent Cron SQL**

Create `supabase/configure-reminder-cron.sql` to unschedule the existing job by name if present and then schedule `process-task-reminders-every-minute`. The scheduled SQL must call `net.http_get`, obtain `reminder_processor_url` and `reminder_processor_secret` from `vault.decrypted_secrets`, and build the bearer `Authorization` header. Do not place a production secret in the file.

The top of the file must include executable Vault setup statements that consume psql variables:

```sql
select vault.create_secret(:'reminder_processor_url', 'reminder_processor_url');
select vault.create_secret(:'reminder_processor_secret', 'reminder_processor_secret');
```

Document the exact invocation:

```powershell
psql $env:SUPABASE_DB_URL `
  --set=reminder_processor_url='https://zeroorigins-os.vercel.app/api/reminders/process' `
  --set=reminder_processor_secret=$env:CRON_SECRET `
  --file=supabase/configure-reminder-cron.sql
```

- [ ] **Step 4: Update environment and operations docs**

Append these keys to `.env.local.example` with descriptive, non-secret example values:

```dotenv
NEXT_PUBLIC_VAPID_PUBLIC_KEY=generated-public-vapid-key
VAPID_PRIVATE_KEY=generated-private-vapid-key
VAPID_SUBJECT=mailto:support@zeroorigins.in
CRON_SECRET=generated-random-cron-secret
```

Update `docs/reminder-notification-engine.md` from “missing” to “implemented” for browser push and Supabase Cron. Include VAPID generation:

```powershell
pnpm exec web-push generate-vapid-keys --json
```

State explicitly that Android uses system notification behavior, exact-second delivery is not guaranteed, and iOS requires Home Screen installation.

- [ ] **Step 5: Verify**

Run: `pnpm test:notification-engine`

Expected: PASS.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 6: Commit**

Commit with Lore intent `Keep minute-level reminders independent of Vercel plan limits`.

### Task 6: Apply, deploy, and verify end to end

**Files:**
- No new source files expected.
- Apply: `supabase/migrations/026_web_push_notifications.sql`
- Execute: `supabase/configure-reminder-cron.sql`

- [ ] **Step 1: Run the complete local verification suite**

Run sequentially:

```powershell
pnpm install --frozen-lockfile
pnpm test:notification-engine
pnpm test:crm-foundation
pnpm test:zo-agent-actions
pnpm lint
pnpm build
git diff --check
```

Expected: all commands pass. Existing unrelated navigation-contract failures are not part of this sequence.

- [ ] **Step 2: Generate and configure secrets without printing private values**

Generate one VAPID pair and one random cron secret. Store the public VAPID key in `NEXT_PUBLIC_VAPID_PUBLIC_KEY`; store the private key, subject, and cron secret in Vercel production environment variables. Never commit generated values or echo them into logs.

- [ ] **Step 3: Apply database migration and scheduler**

Apply migration 026 using the project's established Supabase migration workflow. Run the scheduler SQL with `SUPABASE_DB_URL` and `CRON_SECRET` supplied from the secure environment. Query `cron.job` to confirm exactly one active job named `process-task-reminders-every-minute` with schedule `* * * * *`.

- [ ] **Step 4: Push deployment commits**

Confirm `git status -sb`, push `main`, and verify the deployed commit SHA matches local `HEAD` before Android testing.

- [ ] **Step 5: Perform Android Chrome acceptance**

On Android Chrome:

1. Sign in to the production site.
2. Open the bell and select **Enable device notifications**.
3. Accept the Android permission prompt.
4. Create a reminder at least two minutes ahead.
5. Lock the phone or close Chrome.
6. Confirm the system notification arrives within approximately one minute of the scheduled time.
7. Tap it and confirm the exact task opens.
8. Disable notifications on that device and confirm the subscription becomes inactive.

- [ ] **Step 6: Inspect operational evidence**

Confirm:

- `task_reminders.status = 'triggered'` for the test reminder.
- Exactly one `notification_events` row exists for its reminder ID.
- The Android subscription remains active after successful delivery.
- Supabase `cron.job_run_details` shows a successful invocation.
- Vercel logs show a successful reminder processor response with push counts.

- [ ] **Step 7: Record final verification**

If no source changes were needed during deployment, do not create an empty commit. Report the deployed SHA, automated commands, Android result, scheduler evidence, and the remaining iOS Home Screen acceptance gap.
