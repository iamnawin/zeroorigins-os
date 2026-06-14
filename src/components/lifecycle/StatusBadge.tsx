import { Badge } from '@/components/ui/badge'

const COLORS: Record<string, string> = {
  ideas: 'border-muted-foreground/30 text-muted-foreground',
  evaluating: 'border-sky-500/40 text-sky-300',
  experiment: 'border-yellow-500/40 text-yellow-300',
  prototype: 'border-orange-500/40 text-orange-300',
  application: 'border-zo-purple/50 text-zo-purple-2',
  production_ready: 'border-blue-500/40 text-blue-300',
  live: 'border-green-500/40 text-green-300',
  archived: 'border-muted-foreground/40 text-muted-foreground',
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={`text-[10px] ${COLORS[value] ?? ''}`}>
      {value.replace(/_/g, ' ')}
    </Badge>
  )
}
