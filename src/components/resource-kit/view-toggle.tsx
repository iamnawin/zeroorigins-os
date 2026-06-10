import Link from 'next/link'
import { LayoutList, Columns } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ViewToggleProps {
  basePath: string
  layout: 'table' | 'board'
  showAll: boolean
}

export function ViewToggle({ basePath, layout, showAll }: ViewToggleProps) {
  const viewParam = showAll ? 'view=all' : ''
  const tableHref = viewParam ? `${basePath}?${viewParam}` : basePath
  const boardHref = viewParam ? `${basePath}?${viewParam}&layout=board` : `${basePath}?layout=board`

  return (
    <div className="flex items-center gap-0.5 border border-border rounded-md p-0.5">
      <Link
        href={tableHref}
        className={cn(
          'flex items-center p-1.5 rounded transition-colors',
          layout === 'table' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
        title="Table view"
      >
        <LayoutList className="w-3.5 h-3.5" />
      </Link>
      <Link
        href={boardHref}
        className={cn(
          'flex items-center p-1.5 rounded transition-colors',
          layout === 'board' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
        title="Board view"
      >
        <Columns className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
