import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { sendPushToUser } from '@/lib/notifications/web-push'

type SupabaseLike = SupabaseClient

export type ReminderPriority = 'low' | 'normal' | 'high' | 'urgent'

export type TaskReminderInput = {
  taskId: string
  userId: string
  title: string
  description?: string | null
  priority?: ReminderPriority | string | null
  dueAt?: string | null
  reminderEnabled?: boolean | null
  reminderAt?: string | null
  repeatRule?: string | null
}

export type ProcessDueRemindersResult = {
  processed: number
  notifications: number
  pushSent: number
  pushFailed: number
  pushDeactivated: number
}

function normalizePriority(priority?: string | null): ReminderPriority {
  if (priority === 'low' || priority === 'high' || priority === 'urgent') return priority
  return 'normal'
}

function severityForPriority(priority: ReminderPriority) {
  if (priority === 'urgent') return 'urgent'
  if (priority === 'high') return 'warning'
  return 'info'
}

export async function syncTaskReminder(supabase: SupabaseLike, input: TaskReminderInput) {
  const reminderAt = input.reminderEnabled ? input.reminderAt || input.dueAt : null

  if (!reminderAt) {
    const { error } = await supabase
      .from('task_reminders')
      .update({ status: 'cancelled' })
      .eq('task_id', input.taskId)
      .eq('status', 'scheduled')

    if (error) throw error
    return null
  }

  const priority = normalizePriority(input.priority)
  const { data: existing, error: readError } = await supabase
    .from('task_reminders')
    .select('id')
    .eq('task_id', input.taskId)
    .eq('status', 'scheduled')
    .maybeSingle()

  if (readError) throw readError

  const payload = {
    task_id: input.taskId,
    user_id: input.userId,
    reminder_at: reminderAt,
    next_trigger_at: reminderAt,
    priority,
    channel: 'in_app',
    sound_type: priority === 'urgent' ? 'urgent' : 'default',
    repeat_rule: input.repeatRule || null,
    status: 'scheduled',
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('task_reminders')
      .update(payload)
      .eq('id', existing.id)

    if (error) throw error
    return existing.id as string
  }

  const { data, error } = await supabase
    .from('task_reminders')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

export async function completeTaskReminders(supabase: SupabaseLike, taskId: string) {
  const { error } = await supabase
    .from('task_reminders')
    .update({ status: 'completed' })
    .eq('task_id', taskId)
    .eq('status', 'scheduled')

  if (error) throw error
}

export async function processDueReminders(supabase: SupabaseLike, now = new Date()): Promise<ProcessDueRemindersResult> {
  const nowIso = now.toISOString()
  const { data: reminders, error } = await supabase
    .from('task_reminders')
    .select('id, task_id, user_id, organization_id, reminder_at, priority, channel, tasks(id, title, description, status)')
    .eq('status', 'scheduled')
    .lte('reminder_at', nowIso)
    .limit(50)

  if (error) throw error

  let notifications = 0
  let pushSent = 0
  let pushFailed = 0
  let pushDeactivated = 0

  for (const reminder of reminders ?? []) {
    const task = Array.isArray(reminder.tasks) ? reminder.tasks[0] : reminder.tasks
    if (task?.status === 'done' || task?.status === 'cancelled') {
      await supabase
        .from('task_reminders')
        .update({ status: 'completed', last_triggered_at: nowIso })
        .eq('id', reminder.id)
      continue
    }

    const priority = normalizePriority(reminder.priority)
    const title = task?.title ? `Reminder: ${task.title}` : 'Task reminder'
    const message = task?.description || 'A task reminder is due.'
    const severity = severityForPriority(priority)
    const actionUrl = `/internal/tasks/${reminder.task_id}`
    const { data: event, error: insertError } = await supabase
      .from('notification_events')
      .upsert({
        user_id: reminder.user_id,
        organization_id: reminder.organization_id,
        event_type: 'task_reminder',
        title,
        message,
        severity,
        status: 'unread',
        channel: reminder.channel || 'in_app',
        related_record_type: 'task',
        related_record_id: reminder.task_id,
        task_id: reminder.task_id,
        reminder_id: reminder.id,
        action_url: actionUrl,
        scheduled_for: reminder.reminder_at,
        sent_at: nowIso,
      }, { onConflict: 'reminder_id,event_type' })
      .select('id')
      .single()

    if (insertError) throw insertError
    notifications += 1

    const push = await sendPushToUser(supabase, reminder.user_id, {
      eventId: event.id,
      title,
      message,
      severity,
      actionUrl,
    })
    pushSent += push.sent
    pushFailed += push.failed
    pushDeactivated += push.deactivated

    const { error: updateError } = await supabase
      .from('task_reminders')
      .update({ status: 'triggered', last_triggered_at: nowIso })
      .eq('id', reminder.id)

    if (updateError) throw updateError
  }

  return {
    processed: reminders?.length ?? 0,
    notifications,
    pushSent,
    pushFailed,
    pushDeactivated,
  }
}
