# ZeroOrigins Reminder + Notification Engine

## Current Status

The reminder engine and Android Chrome Web Push delivery are implemented in the app code.

What exists today:

- A legacy `notifications` table from the initial schema with `user_id`, `title`, `message`, `read`, and `link`.
- Meeting creation can send email notifications through `src/lib/email/notifications.ts` when Resend is configured.
- Leads and partners have automation metadata fields for future n8n workflows.
- Automation UI mentions Telegram alerts, but that is status copy only.
- `task_reminders`, `notification_events`, and `notification_preferences` are defined in `supabase/migrations/025_reminder_notification_engine.sql`.
- Task create/edit supports priority, due date/time, and one in-app reminder.
- Command Center task creation routes reminders into the same task reminder helper when a due/reminder time is present.
- A protected `GET /api/reminders/process` route creates in-app notification events for due reminders.
- The login proxy explicitly allows `/api/reminders/process` through so cron authentication can happen inside the route.
- While the authenticated app is open, the notification bell calls `POST /api/reminders/process` every 30 seconds and refreshes the bell. This is the fallback when no external scheduler is configured.
- The internal header has a notification bell with unread count, read-all, dismiss, and in-app sound while the app is open.
- Each signed-in device can opt into background Web Push notifications from the bell menu.
- `push_subscriptions` is defined in `supabase/migrations/026_web_push_notifications.sql` with owner-only RLS.
- `public/sw.js` displays background notifications and opens the exact task when tapped.
- The reminder processor sends encrypted Web Push payloads when VAPID credentials are configured.
- `supabase/configure-reminder-cron.sql` configures Supabase Cron to call the processor every minute on Vercel Hobby.
- Control Room shows `Today's Command Queue` above Radar Headlines.

What is missing:

- Telegram/WhatsApp fallback integration.
- Complex recurrence beyond the saved `repeat_rule` field.

## Product Principle

ZeroOrigins OS owns business tasks, reminders, and notification history. External channels such as Telegram, WhatsApp, email, browser push, and n8n are delivery channels or fallback channels. They must not become the source of truth.

The source of truth should be:

1. `tasks` and linked business records for the work.
2. `task_reminders` for reminder scheduling.
3. `notification_events` for what the user should see and act on.
4. `notification_preferences` for user delivery settings.

## Practical Notification Model

Browser push custom sounds are not reliable across browsers/devices. Browser and OS settings control the sound.

Use this model:

- In-app notification sound: works only while ZeroOrigins OS is open.
- Browser/PWA push: uses system notification behavior and requires permission.
- Installing the site as a PWA does not enable push by itself. Closed-app delivery additionally requires a service worker, a persisted `PushSubscription`, VAPID keys, and a server-side push sender.
- Telegram/WhatsApp/email: future fallback channels for urgent reminders.

## Phase 1 - Core Reminder System

Goal: make ZeroOrigins OS reliable for internal reminders without depending on Telegram, WhatsApp, or browser push.

Scope:

- Add missing task reminder fields safely.
- Add `task_reminders`.
- Add `notification_events`.
- Add `notification_preferences`.
- Add global notification bell in the authenticated/internal shell.
- Add reminder controls to task create/edit.
- Show reminder/due/priority metadata in task list and task detail.
- Add due/overdue/upcoming reminders to Control Room as `Today's Command Queue`.
- Add in-app sound utility for open-browser reminders.
- Add server actions for marking notifications read/dismissed.
- Add a protected `/api/reminders/process` route for scheduled processing.
- Keep all records protected by RLS.

Do not implement complex recurrence in Phase 1. Support `none` first. Add `daily`/`weekly` only if the implementation stays small and testable.

## Phase 2 - Browser/PWA Push Foundation (Implemented)

Goal: prepare browser reminders without making unreliable sound promises.

Scope:

- `push_subscriptions` with strict per-user RLS.
- Explicit notification permission UI in the bell menu.
- Authenticated subscribe/unsubscribe Route Handler.
- `public/sw.js` with push display and click navigation.
- Optional server-side delivery that leaves in-app processing operational when VAPID is absent.

Required env vars when browser push is implemented:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT=mailto:support@zeroorigins.in`
- `CRON_SECRET`

Generate one VAPID pair and reuse it for every deployment:

```powershell
pnpm exec web-push generate-vapid-keys --json
```

Set the four values in Vercel Production before building. The public key is intentionally exposed to the browser; the private key and cron secret must remain server-only.

## Phase 3 - Telegram/n8n Fallback

Goal: use Telegram as an external delivery and command channel, not as the core reminder engine.

Recommended architecture:

- Telegram bot token stays only in n8n credentials or the deployment secret store.
- n8n receives Telegram updates.
- n8n normalizes events and sends them to ZeroOrigins OS through a protected webhook.
- ZeroOrigins OS creates/reads first-party records.
- n8n sends the reply back to Telegram.

Initial Telegram use cases:

- Send urgent reminder alerts.
- Send overdue task summaries.
- Send today's command queue.
- Later: create task/lead/meeting/spending by forwarding text into the existing Command Center backend.

Security rules:

- Never commit Telegram tokens.
- Revoke/regenerate any token pasted into chat or logs.
- Require a shared webhook secret for n8n to ZeroOrigins OS.
- Store external Telegram user/chat identifiers separately from internal user IDs.

## Planned Database Changes

Create a new Supabase migration. Do not drop or rename existing tables.

Extend `tasks` only for missing fields:

- `due_at timestamptz`
- `priority text not null default 'normal'`
- `reminder_enabled boolean not null default false`
- `reminder_at timestamptz`
- `repeat_rule text`
- `completed_at timestamptz`
- `cancelled_at timestamptz`
- `related_record_type text`
- `related_record_id uuid`

The existing `tasks.due_date` should be preserved for compatibility. New UI should prefer `due_at` when present and fall back to `due_date`.

Add `task_reminders`:

- `id uuid primary key default gen_random_uuid()`
- `task_id uuid not null references tasks(id) on delete cascade`
- `user_id uuid not null`
- `organization_id uuid`
- `reminder_at timestamptz not null`
- `status text not null default 'scheduled'`
- `priority text not null default 'normal'`
- `channel text not null default 'in_app'`
- `sound_type text not null default 'default'`
- `repeat_rule text`
- `last_triggered_at timestamptz`
- `next_trigger_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Add `notification_events`:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null`
- `organization_id uuid`
- `event_type text not null`
- `title text not null`
- `message text`
- `severity text not null default 'info'`
- `status text not null default 'unread'`
- `channel text not null default 'in_app'`
- `related_record_type text`
- `related_record_id uuid`
- `task_id uuid references tasks(id) on delete set null`
- `reminder_id uuid references task_reminders(id) on delete set null`
- `action_url text`
- `scheduled_for timestamptz`
- `sent_at timestamptz`
- `read_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Add `notification_preferences`:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null`
- `organization_id uuid`
- `in_app_enabled boolean not null default true`
- `browser_push_enabled boolean not null default false`
- `email_enabled boolean not null default false`
- `telegram_enabled boolean not null default false`
- `whatsapp_enabled boolean not null default false`
- `sound_enabled boolean not null default true`
- `urgent_sound_enabled boolean not null default true`
- `quiet_hours_enabled boolean not null default false`
- `quiet_hours_start time`
- `quiet_hours_end time`
- `timezone text not null default 'Asia/Kolkata'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Add `push_subscriptions` in Phase 2:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null`
- `organization_id uuid`
- `endpoint text not null`
- `p256dh text not null`
- `auth text not null`
- `user_agent text`
- `device_label text`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## Processing Flow

1. User creates or edits a task with reminder settings.
2. Server validates reminder fields and upserts one active `task_reminders` row.
3. Supabase Cron calls `/api/reminders/process` every minute.
4. Processor finds scheduled reminders where `reminder_at <= now()`.
5. Processor creates one idempotent `notification_events` row per due reminder.
6. Processor sends Web Push to the user's active devices when VAPID is configured.
7. Processor marks the reminder as `triggered`, or schedules the next reminder for supported repeat rules.
8. Notification bell reads unread events.
9. Clicking or tapping a notification opens `action_url`.
10. Marking a task done completes active reminders.
11. Cancelling a task cancels active reminders.

## Supabase Cron Setup

Route:

- `GET /api/reminders/process`

Vercel Hobby cannot run a job every minute, so Supabase Cron invokes the Vercel Route Handler. This is separate from existing cron jobs such as email sync.

Security:

- Require `CRON_SECRET`.
- Supabase Vault stores the processor URL and secret.
- The scheduled request sends `Authorization: Bearer <CRON_SECRET>`.
- Never leave the route fully public.

Apply the scheduler after setting `SUPABASE_DB_URL` and `CRON_SECRET` in the current PowerShell session:

```powershell
psql $env:SUPABASE_DB_URL `
  --set=reminder_processor_url='https://zeroorigins-os.vercel.app/api/reminders/process' `
  --set=reminder_processor_secret=$env:CRON_SECRET `
  --file=supabase/configure-reminder-cron.sql
```

The setup file replaces only the job named `process-task-reminders-every-minute`. If the two Vault secret names already exist, update or remove those values in the Supabase Vault before rerunning the setup file.

Idempotency:

- Before creating a notification, check for an existing event with the same `reminder_id` and `event_type = 'task_reminder'`.
- Avoid duplicate events if cron runs multiple times.

Delivery timing and platform behavior:

- The one-minute schedule means delivery is usually near the selected minute, not at an exact second.
- Android Chrome uses Android's system notification sound and vibration settings; the site cannot force a custom background sound.
- Battery optimization, Do Not Disturb, or denied site permission can delay or silence a notification.
- iOS/iPadOS Web Push requires installing the site to the Home Screen before enabling notifications.

## UI Plan

Global notification bell:

- Add to internal header.
- Show unread count.
- Open dropdown/panel.
- Sort unread first.
- Support mark read, mark all read, and dismiss if implemented.
- Click opens exact record.

Task UI:

- Add due date/time.
- Add reminder preset.
- Add priority.
- Add channel with only `in_app` fully active in Phase 1.
- Add sound preference.
- Show due/reminder badges on task rows.

Control Room:

- Add `Today's Command Queue`.
- Show due tasks, overdue reminders, urgent reminders, lead follow-ups, application reminders, and upcoming reminders today.
- Empty copy: `Nothing is due right now. Create a task reminder or ask the agent to plan your next operating move.`

## Command Center Hooks

Future prompts should route into the same first-party reminder backend:

- `Remind me tomorrow to follow up with Himanshu.`
- `Create a task for Srikar to test Gmail sync by Friday.`
- `Remind me 30 minutes before every client meeting.`
- `Show overdue lead follow-ups.`
- `What needs my attention today?`

Do not hardcode fake execution. If an intent is unsupported, return a clear actionable message.

## Testing Checklist

Database:

- Migration runs.
- RLS blocks cross-user reminder/notification access.
- Existing tasks still load.
- Existing task create/edit still works.

Reminder behavior:

- Create task with no reminder.
- Create task with reminder at due time.
- Edit reminder time.
- Disable reminder.
- Mark task done and verify active reminder completes.
- Trigger cron twice and verify only one notification event exists.

Notification UI:

- Bell appears in internal layout.
- Unread count updates.
- Mark read works.
- Mark all read works.
- Notification opens correct route.
- Mobile panel has no horizontal overflow.

Sound:

- Plays only while app is open.
- Respects sound preference.
- Silent reminders do not play sound.
- Urgent sound is distinct but not noisy.

Cron:

- Unauthorized request blocked.
- Authorized request processes due reminders.
- GET works for scheduler.
- Errors do not leak sensitive details.

Build:

- `pnpm lint`
- `pnpm build`

## Open Risks

- Remote Supabase migrations are manually applied, so schema drift must be checked before debugging.
- Supabase Cron authentication and run history must be verified after production setup.
- Android system delivery depends on Chrome permission, OS notification settings, and battery policy.
- Telegram/n8n tokens are high-risk secrets and must stay out of source, screenshots, and chat logs.
