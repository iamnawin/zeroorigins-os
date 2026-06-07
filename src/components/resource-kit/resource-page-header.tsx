import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ResourcePageHeaderProps {
  title: string
  description: string
  newHref?: string
  newLabel?: string
  showNew?: boolean
}

export function ResourcePageHeader({ title, description, newHref, newLabel, showNew = true }: ResourcePageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-zo-chrome">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {showNew && newHref && (
        <Link href={newHref}>
          <Button size="sm"><Plus className="w-4 h-4 mr-1" />{newLabel || 'New'}</Button>
        </Link>
      )}
    </div>
  )
}
