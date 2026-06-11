import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowRight, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  count: number
  status: string
  description: string
  href: string
  accent?: 'purple' | 'blue' | 'green' | 'orange'
  className?: string
}

export function StatCard({ 
  icon: Icon, 
  label, 
  count, 
  status, 
  description, 
  href,
  accent = 'purple',
  className
}: StatCardProps) {
  const accentColors = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 group-hover:border-purple-500/40',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 group-hover:border-blue-500/40',
    green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 group-hover:border-emerald-500/40',
    orange: 'from-amber-500/20 to-amber-600/10 border-amber-500/20 group-hover:border-amber-500/40'
  }

  const iconColors = {
    purple: 'text-purple-400 group-hover:text-purple-300',
    blue: 'text-blue-400 group-hover:text-blue-300',
    green: 'text-emerald-400 group-hover:text-emerald-300',
    orange: 'text-amber-400 group-hover:text-amber-300'
  }

  return (
    <Link 
      href={href}
      className={cn(
        "group relative overflow-hidden zo-surface-elevated hover:zo-glass zo-motion-safe block p-6 rounded-xl border",
        accentColors[accent],
        className
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 zo-motion-safe">
        <div className="absolute top-4 right-4">
          <Icon className="w-12 h-12 text-white" />
        </div>
      </div>
      
      {/* Accent line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-60 group-hover:opacity-100 zo-motion-safe",
        iconColors[accent]
      )} />

      <div className="relative z-10 space-y-4">
        {/* Icon and count */}
        <div className="flex items-start justify-between">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center zo-motion-safe",
            accent === 'purple' ? 'bg-purple-500/10 group-hover:bg-purple-500/15' :
            accent === 'blue' ? 'bg-blue-500/10 group-hover:bg-blue-500/15' :
            accent === 'green' ? 'bg-emerald-500/10 group-hover:bg-emerald-500/15' :
            'bg-amber-500/10 group-hover:bg-amber-500/15'
          )}>
            <Icon className={cn("w-5 h-5 zo-motion-safe", iconColors[accent])} />
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white tabular-nums">{count}</div>
            <div className={cn("text-sm font-medium", iconColors[accent])}>{status}</div>
          </div>
        </div>

        {/* Label and description */}
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">{label}</h3>
          <p className="text-sm text-white/60 leading-relaxed">{description}</p>
        </div>

        {/* Hover indicator */}
        <div className="flex items-center text-white/40 group-hover:text-white/60 zo-motion-safe">
          <span className="text-xs font-medium">View details</span>
          <ArrowRight className="ml-1 w-3 h-3 group-hover:translate-x-0.5 zo-motion-safe" />
        </div>
      </div>
    </Link>
  )
}