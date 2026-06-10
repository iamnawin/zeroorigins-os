import Link from 'next/link'

export interface BoardCard {
  id: string
  href: string
  primary: string
  secondary?: string
  status: string
}

export interface BoardColumn {
  status: string
  label: string
}

interface EntityBoardProps {
  columns: BoardColumn[]
  cards: BoardCard[]
}

export function EntityBoard({ columns, cards }: EntityBoardProps) {
  const byStatus: Record<string, BoardCard[]> = {}
  for (const col of columns) {
    byStatus[col.status] = cards.filter(c => c.status === col.status)
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {columns.map(col => {
          const colCards = byStatus[col.status] ?? []
          return (
            <div key={col.status} className="w-52 shrink-0">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {col.label}
                </span>
                <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 font-medium">
                  {colCards.length}
                </span>
              </div>
              <div className="space-y-1.5 min-h-[60px]">
                {colCards.map(card => (
                  <Link
                    key={card.id}
                    href={card.href}
                    className="block p-3 rounded-lg border border-border bg-card hover:border-zo-purple/30 transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground leading-snug">{card.primary}</p>
                    {card.secondary && (
                      <p className="text-[11px] text-muted-foreground mt-1 truncate">{card.secondary}</p>
                    )}
                  </Link>
                ))}
                {colCards.length === 0 && (
                  <div className="p-3 rounded-lg border border-dashed border-border">
                    <p className="text-[11px] text-muted-foreground text-center">—</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
