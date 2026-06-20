import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

function read(file) {
  return readFileSync(file, 'utf8')
}

function assertFile(file) {
  assert.ok(existsSync(file), `${file} should exist`)
  return read(file)
}

const migration = assertFile('supabase/migrations/025_reminder_notification_engine.sql')
const reminderService = assertFile('src/lib/notifications/reminders.ts')
const actions = assertFile('src/lib/actions/notification-events.ts')
const processRoute = assertFile('src/app/api/reminders/process/route.ts')
const bell = assertFile('src/components/notifications/notification-bell.tsx')
const header = assertFile('src/components/layout/internal-header.tsx')
const taskForm = assertFile('src/components/forms/TaskForm.tsx')
const taskPage = assertFile('src/app/(internal)/internal/tasks/page.tsx')
const taskDetail = assertFile('src/app/(internal)/internal/tasks/[id]/page.tsx')

for (const column of [
  'due_at timestamptz',
  "priority text not null default 'normal'",
  "reminder_enabled boolean not null default false",
  'reminder_at timestamptz',
  'completed_at timestamptz',
  'cancelled_at timestamptz',
]) {
  assert.match(migration, new RegExp(column.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `migration should add ${column}`)
}

assert.match(migration, /create table if not exists task_reminders/)
assert.match(migration, /create table if not exists notification_events/)
assert.match(migration, /create table if not exists notification_preferences/)
assert.match(migration, /enable row level security/)
assert.match(migration, /create unique index if not exists idx_notification_events_reminder_once/)
assert.match(migration, /is_internal_user\(\)/)

assert.match(reminderService, /export async function syncTaskReminder/)
assert.match(reminderService, /export async function processDueReminders/)
assert.match(reminderService, /notification_events/)
assert.match(reminderService, /task_reminder/)
assert.match(reminderService, /onConflict:\s*'reminder_id,event_type'/)
assert.match(reminderService, /completeTaskReminders/)

assert.match(actions, /markNotificationRead/)
assert.match(actions, /markAllNotificationsRead/)
assert.match(actions, /dismissNotification/)
assert.match(actions, /requireInternalUser/)

assert.match(processRoute, /Authorization/)
assert.match(processRoute, /CRON_SECRET/)
assert.match(processRoute, /processDueReminders/)
assert.match(processRoute, /status:\s*401/)

assert.match(bell, /NotificationBell/)
assert.match(bell, /markNotificationRead/)
assert.match(bell, /markAllNotificationsRead/)
assert.match(bell, /Bell/)
assert.match(bell, /playInAppNotificationSound/)
assert.match(header, /NotificationBell/)

assert.match(taskForm, /Reminder/)
assert.match(taskForm, /priority/)
assert.match(taskForm, /due_at/)
assert.match(taskForm, /reminder_enabled/)
assert.match(taskForm, /reminder_at/)

assert.match(taskPage, /reminder_at/)
assert.match(taskPage, /priority/)
assert.match(taskDetail, /Reminder/)
assert.match(taskDetail, /timeZone:\s*['"]Asia\/Kolkata['"]/)

console.log('Notification engine contract OK')
