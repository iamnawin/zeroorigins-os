import Link from 'next/link'

interface ResourceViewTabsProps {
  basePath: string
  showAll: boolean
}

export function ResourceViewTabs({ basePath, showAll }: ResourceViewTabsProps) {
  return (
    <div className="flex gap-1">
      <Link href={basePath}>
        <span className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${!showAll ? 'text-zo-amber border border-zo-amber/50' : 'text-muted-foreground hover:text-foreground'}`}>
          Active
        </span>
      </Link>
      <Link href={`${basePath}?view=all`}>
        <span className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${showAll ? 'text-zo-amber border border-zo-amber/50' : 'text-muted-foreground hover:text-foreground'}`}>
          All
        </span>
      </Link>
    </div>
  )
}
