import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TERMINAL_STATUSES = new Set([
  'archived', 'rejected', 'cancelled', 'lost', 'done', 'expired', 'paused'
])

interface ResourceStatusBadgeProps {
  status: string
  className?: string
}

export function ResourceStatusBadge({ status, className }: ResourceStatusBadgeProps) {
  const isTerminal = TERMINAL_STATUSES.has(status)
  return (
    <Badge 
      variant={isTerminal ? 'outline' : 'default'} 
      className={cn('text-[10px] uppercase font-bold tracking-tighter', isTerminal && 'opacity-40 grayscale', className)}
    >
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}
