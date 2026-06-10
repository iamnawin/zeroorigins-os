import Link from 'next/link'

interface ResourceViewTabsProps {
  basePath: string
  showAll: boolean
  layout?: 'table' | 'board'
}

export function ResourceViewTabs({ basePath, showAll, layout }: ResourceViewTabsProps) {
  const layoutParam = layout === 'board' ? '&layout=board' : ''
  const activeHref = layout === 'board' ? `${basePath}?layout=board` : basePath
  const allHref = `${basePath}?view=all${layoutParam}`

  return (
    <div className="flex gap-1 selection:bg-zo-purple/20">
      <Link href={activeHref}>
        <span className={`text-xs px-3 py-1.5 rounded transition-all cursor-pointer font-bold uppercase tracking-widest ${!showAll ? 'text-zo-purple-2 bg-zo-purple/10 border border-zo-purple/20' : 'text-zo-muted hover:text-zo-chrome hover:bg-muted'}`}>
          Active
        </span>
      </Link>
      <Link href={allHref}>
        <span className={`text-xs px-3 py-1.5 rounded transition-all cursor-pointer font-bold uppercase tracking-widest ${showAll ? 'text-zo-purple-2 bg-zo-purple/10 border border-zo-purple/20' : 'text-zo-muted hover:text-zo-chrome hover:bg-muted'}`}>
          All
        </span>
      </Link>
    </div>
  )
}
