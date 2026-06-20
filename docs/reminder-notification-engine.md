# ZeroOrigins Reminder + Notification Engine

## Current Status

Phase 1 foundation is implemented in the app code.

What exists today:

- A legacy `notifications` table from the initial schema with `user_id`, `title`, `message`, `read`, and `link`.
- Meeting creation can send email notifications through `src/lib/email/notifications.ts` when Resend is configured.
- Leads and partners have automation metadata fields for future n8n workflows.
- Automation UI mentions Telegram alerts, but that is status copy only.
- `task_reminders`, `notification_events`, and `notification_preferences` are defined in `supabase/migrations/025_reminder_notification_engine.sql`.
- Task create/edit supports priority, due date/time, and one in-app reminder.
- Command Center task creation routes reminders into the same task reminder helper when a due/reminder time is present.
- A protected `GET /api/reminders/process` route creates in-app notification events for due reminders.
- The internal header has a notification bell with unread count, read-all, dismiss, and in-app sound while the app is open.
- Control Room shows `Today's Command Queue` above Radar Headlines.

What is missing:

- Browser push subscriptions.
- Vercel Cron configuration for invoking `/api/reminders/process`.
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

## Phase 2 - Browser/PWA Push Foundation

Goal: prepare browser reminders without making unreliable sound promises.

Scope:

- Add `push_subscriptions`.
- Add notification permission UI.
- Add subscribe/unsubscribe API routes.
- Add `public/sw.js` only if it fits the current Next.js app structure.
- Add push click handling that opens `action_url`.
- Add VAPID env var documentation.
- Keep push sending optional until verified end to end.

Required env vars when browser push is implemented:

- `NEXT_PUBLIC_APP_URL`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT=mailto:support@zeroorigins.in`

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
3. `/api/reminders/process` runs every 5 minutes.
4. Processor finds scheduled reminders where `reminder_at <= now()`.
5. Processor creates one idempotent `notification_events` row per due reminder.
6. Processor marks reminder as `triggered`, or schedules the next reminder for supported repeat rules.
7. Notification bell reads unread events.
8. Clicking a notification opens `action_url`.
9. Marking task done completes active reminders.
10. Cancelling task cancels active reminders.

## Cron Design

Route:

- `GET /api/reminders/process`

Security:

- Require `CRON_SECRET`.
- Prefer `Authorization: Bearer <CRON_SECRET>` for external schedulers.
- If using Vercel Cron and custom headers are unavailable, allow a strong query secret only if documented and not exposed.
- Never leave the route fully public.

Idempotency:

- Before creating a notification, check for an existing event with the same `reminder_id` and `event_type = 'task_reminder'`.
- Avoid duplicate events if cron runs multiple times.

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
- Browser push may need a dependency such as `web-push`; do not add it without reviewing package impact.
- Vercel Cron authentication must be verified before relying on it.
- Telegram/n8n tokens are high-risk secrets and must stay out of source, screenshots, and chat logs.
