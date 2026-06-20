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
        <span className={`cursor-pointer rounded px-3 py-1.5 text-xs font-bold uppercase transition-all ${!showAll ? 'border border-zo-purple/20 bg-zo-purple/10 text-zo-purple-2' : 'text-zo-muted hover:bg-muted hover:text-zo-chrome'}`}>
          Active
        </span>
      </Link>
      <Link href={allHref}>
        <span className={`cursor-pointer rounded px-3 py-1.5 text-xs font-bold uppercase transition-all ${showAll ? 'border border-zo-purple/20 bg-zo-purple/10 text-zo-purple-2' : 'text-zo-muted hover:bg-muted hover:text-zo-chrome'}`}>
          All
        </span>
      </Link>
    </div>
  )
}
