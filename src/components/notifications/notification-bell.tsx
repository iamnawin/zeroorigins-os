'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useTransition } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { dismissNotification, markAllNotificationsRead, markNotificationRead } from '@/lib/actions/notification-events'

export type NotificationBellItem = {
  id: string
  title: string
  message?: string | null
  severity: string
  status: string
  action_url?: string | null
  created_at: string
}

type NotificationBellProps = {
  notifications: NotificationBellItem[]
}

export function NotificationBell({ notifications }: NotificationBellProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const unreadCount = notifications.filter(item => item.status === 'unread').length
  const previousUnreadCount = useRef(unreadCount)

  useEffect(() => {
    if (unreadCount <= previousUnreadCount.current) {
      previousUnreadCount.current = unreadCount
      return
    }

    previousUnreadCount.current = unreadCount
    playInAppNotificationSound()
  }, [unreadCount])

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action()
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-zo-purple px-1.5 text-center text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(92vw,24rem)] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending || unreadCount === 0}
            onClick={() => run(markAllNotificationsRead)}
          >
            <CheckCheck className="mr-1 h-4 w-4" />
            Read all
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">Nothing needs attention right now.</p>
          ) : (
            notifications.map(item => (
              <DropdownMenuItem key={item.id} className="block rounded-md p-0 focus:bg-muted">
                <div className="group flex gap-2 rounded-md px-2 py-2">
                  <Link
                    href={item.action_url || '/internal/control-room'}
                    className="min-w-0 flex-1"
                    onClick={() => run(() => markNotificationRead(item.id))}
                  >
                    <div className="flex items-center gap-2">
                      <span className={severityClass(item.severity)} />
                      <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    </div>
                    {item.message && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.message}</p>}
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatTime(item.created_at)}</p>
                  </Link>
                  <button
                    type="button"
                    className="h-7 w-7 shrink-0 rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
                    disabled={pending}
                    onClick={() => run(() => dismissNotification(item.id))}
                    aria-label="Dismiss notification"
                  >
                    <X className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <Link href="/internal/tasks" className="block px-3 py-2 text-xs font-medium text-zo-purple-2 hover:bg-muted">
          Open tasks
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function playInAppNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = 740
    gain.gain.value = 0.035

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.12)
    oscillator.addEventListener('ended', () => {
      void context.close()
    })
  } catch {
    // Browser autoplay policies can block sound until the user interacts with the page.
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

function severityClass(severity: string) {
  if (severity === 'urgent') return 'h-2 w-2 shrink-0 rounded-full bg-red-400'
  if (severity === 'warning') return 'h-2 w-2 shrink-0 rounded-full bg-amber-300'
  if (severity === 'success') return 'h-2 w-2 shrink-0 rounded-full bg-emerald-400'
  return 'h-2 w-2 shrink-0 rounded-full bg-zo-purple-2'
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value))
}
