import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TERMINAL_STATUSES = new Set([
  'archived', 'rejected', 'cancelled', 'lost', 'done', 'expired',
])

interface ResourceStatusBadgeProps {
  status: string
  className?: string
}

export function ResourceStatusBadge({ status, className }: ResourceStatusBadgeProps) {
  const isTerminal = TERMINAL_STATUSES.has(status)
  return (
    <Badge className={cn('text-[10px]', isTerminal && 'opacity-50', className)}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}
