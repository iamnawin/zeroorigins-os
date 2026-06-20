import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ResourcePageHeaderProps {
  title: string
  description: string
  newHref?: string
  newLabel?: string
  showNew?: boolean
  action?: React.ReactNode
}

export function ResourcePageHeader({ title, description, newHref, newLabel, showNew = true, action }: ResourcePageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 selection:bg-zo-purple/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-lg font-bold text-zo-chrome sm:text-xl">{title}</h1>
        <p className="text-xs text-zo-muted sm:text-sm">{description}</p>
      </div>
      {action ?? (showNew && newHref && (
        <Link href={newHref}>
          <Button size="sm" className="font-bold"><Plus className="w-4 h-4 mr-1" />{newLabel || 'New'}</Button>
        </Link>
      ))}
    </div>
  )
}
