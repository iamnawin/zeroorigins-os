import { cn } from '@/lib/utils'
import { scoreTier } from '@/lib/radar/scoring'

interface RadarScoreBadgeProps {
  score: number
  label?: string
  className?: string
}

export function RadarScoreBadge({ score, label, className }: RadarScoreBadgeProps) {
  const tier = scoreTier(score)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
        tier === 'high' && 'bg-emerald-500/15 text-emerald-400',
        tier === 'medium' && 'bg-amber-500/15 text-amber-400',
        tier === 'low' && 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {label && <span className="opacity-70">{label}</span>}
      {score}/10
    </span>
  )
}
