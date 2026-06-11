import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  badge?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ 
  title, 
  subtitle, 
  badge,
  actions,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        {/* Status Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-white">{title}</h1>
            {badge && (
              <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">{badge}</span>
              </div>
            )}
          </div>
          
          {subtitle && (
            <p className="text-xl text-white/80">{subtitle}</p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex flex-wrap gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}