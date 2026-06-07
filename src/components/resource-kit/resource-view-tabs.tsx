import Link from 'next/link'

interface ResourceViewTabsProps {
  basePath: string
  showAll: boolean
}

export function ResourceViewTabs({ basePath, showAll }: ResourceViewTabsProps) {
  return (
    <div className="flex gap-1 selection:bg-zo-purple/20">
      <Link href={basePath}>
        <span className={`text-xs px-3 py-1.5 rounded transition-all cursor-pointer font-bold uppercase tracking-widest ${!showAll ? 'text-zo-purple-2 bg-zo-purple/10 border border-zo-purple/20 shadow-[0_0_10px_rgba(139,92,246,0.1)]' : 'text-zo-muted hover:text-zo-chrome hover:bg-white/5'}`}>
          Active
        </span>
      </Link>
      <Link href={`${basePath}?view=all`}>
        <span className={`text-xs px-3 py-1.5 rounded transition-all cursor-pointer font-bold uppercase tracking-widest ${showAll ? 'text-zo-purple-2 bg-zo-purple/10 border border-zo-purple/20 shadow-[0_0_10px_rgba(139,92,246,0.1)]' : 'text-zo-muted hover:text-zo-chrome hover:bg-white/5'}`}>
          All
        </span>
      </Link>
    </div>
  )
}
