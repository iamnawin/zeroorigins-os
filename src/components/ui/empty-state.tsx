import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Plus, type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  className?: string
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  actionHref,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("py-12 text-center space-y-4", className)}>
      <div className="w-12 h-12 mx-auto bg-white/5 rounded-xl flex items-center justify-center">
        <Icon className="w-6 h-6 text-white/40" />
      </div>
      <div className="space-y-2">
        <h3 className="font-medium text-white/80">{title}</h3>
        <p className="text-sm text-white/50 max-w-sm mx-auto leading-relaxed">{description}</p>
      </div>
      {actionLabel && actionHref && (
        <Link 
          href={actionHref}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-300 hover:text-purple-200 zo-motion-safe"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Link>
      )}
    </div>
  )
}