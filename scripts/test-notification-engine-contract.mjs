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
const proxy = assertFile('src/proxy.ts')
const pushMigration = assertFile('supabase/migrations/026_web_push_notifications.sql')
const serviceWorker = assertFile('public/sw.js')
const pushRoute = assertFile('src/app/api/notifications/push-subscription/route.ts')
const pushControl = assertFile('src/components/notifications/push-notification-control.tsx')
const pushSender = assertFile('src/lib/notifications/web-push.ts')
const cronSetup = assertFile('supabase/configure-reminder-cron.sql')
const envExample = assertFile('.env.local.example')

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

assert.match(pushRoute, /export async function POST/)
assert.match(pushRoute, /export async function DELETE/)
assert.match(pushRoute, /auth\.getUser\(\)/)
assert.match(pushRoute, /INTERNAL_ROLES\.includes/)
assert.match(pushRoute, /user_id:\s*user\.id/)
assert.match(pushRoute, /\.eq\(['"]user_id['"],\s*user\.id\)/)
assert.doesNotMatch(pushRoute, /user_id:\s*body\./)

assert.match(pushControl, /^['"]use client['"]/)
assert.match(pushControl, /Notification\.requestPermission\(\)/)
assert.match(pushControl, /navigator\.serviceWorker\.register\(['"]\/sw\.js['"]\)/)
assert.match(pushControl, /pushManager\.subscribe/)
assert.match(pushControl, /applicationServerKey/)
assert.match(pushControl, /\/api\/notifications\/push-subscription/)
assert.match(pushControl, /method:\s*['"]DELETE['"]/)
assert.match(bell, /PushNotificationControl/)

assert.match(pushSender, /import ['"]server-only['"]/)
assert.match(pushSender, /setVapidDetails/)
assert.match(pushSender, /sendNotification/)
assert.match(pushSender, /push_subscriptions/)
assert.match(pushSender, /statusCode === 404/)
assert.match(pushSender, /statusCode === 410/)
assert.match(reminderService, /sendPushToUser/)
assert.match(processRoute, /runtime\s*=\s*['"]nodejs['"]/)

assert.match(cronSetup, /cron\.schedule/)
assert.match(cronSetup, /['"]\* \* \* \* \*['"]/)
assert.match(cronSetup, /vault\.decrypted_secrets/)
assert.match(cronSetup, /Authorization/)
assert.doesNotMatch(cronSetup, /:'reminder_processor_/)
assert.match(cronSetup, /REPLACE_WITH_CRON_SECRET/)
const configuredCronSetup = cronSetup.replaceAll('REPLACE_WITH_CRON_SECRET', 'configured-cron-secret')
assert.doesNotMatch(configuredCronSetup, /if processor_secret = 'configured-cron-secret'/)
assert.match(envExample, /NEXT_PUBLIC_VAPID_PUBLIC_KEY/)
assert.match(envExample, /VAPID_PRIVATE_KEY/)
assert.match(envExample, /VAPID_SUBJECT/)

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
assert.match(processRoute, /dynamic\s*=\s*['"]force-dynamic['"]/)
assert.match(processRoute, /Bearer /)
assert.match(processRoute, /searchParams\.get\(['"]secret['"]\)/)
assert.match(processRoute, /export async function POST/)
assert.match(processRoute, /auth\.getUser\(\)/)
assert.match(processRoute, /INTERNAL_ROLES\.includes/)

assert.match(proxy, /pathname === ['"]\/api\/reminders\/process['"]/, 'proxy should not redirect reminder cron to login')

assert.match(bell, /NotificationBell/)
assert.match(bell, /markNotificationRead/)
assert.match(bell, /markAllNotificationsRead/)
assert.match(bell, /Bell/)
assert.match(bell, /playInAppNotificationSound/)
assert.match(bell, /fetch\(['"]\/api\/reminders\/process['"]/)
assert.match(bell, /setInterval/)
assert.match(bell, /visibilitychange/)
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
