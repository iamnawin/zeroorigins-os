import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  elevated?: boolean
  withGrid?: boolean
}

export function GlassPanel({ 
  children, 
  className, 
  elevated = false,
  withGrid = false
}: GlassPanelProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl",
      elevated ? "zo-glass-elevated border-white/10" : "zo-glass border-white/10",
      className
    )}>
      {withGrid && (
        <div className="absolute inset-0 zo-grid-pattern opacity-10" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}