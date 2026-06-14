import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type GridRevealProps = {
  children: ReactNode
  className?: string
}

type GridRevealItemProps = {
  children: ReactNode
  className?: string
  index?: number
}

type RevealStyle = CSSProperties & {
  '--grid-reveal-delay'?: string
}

export function GridReveal({ children, className }: GridRevealProps) {
  return (
    <div className={cn('zo-grid-reveal', className)}>
      {children}
    </div>
  )
}

export function GridRevealItem({ children, className, index = 0 }: GridRevealItemProps) {
  const delay = Math.min(index, 18) * 55

  return (
    <div className={cn('zo-grid-reveal-item', className)} style={{ '--grid-reveal-delay': `${delay}ms` } as RevealStyle}>
      {children}
    </div>
  )
}
