import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface TableColumn<T> {
  key: string
  label: string
  width?: string
  render: (row: T) => React.ReactNode
}

interface EntityTableProps<T extends { id: string }> {
  rows: T[]
  columns: TableColumn<T>[]
  getHref: (row: T) => string
}

export function EntityTable<T extends { id: string }>({ rows, columns, getHref }: EntityTableProps<T>) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map(col => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr
              key={row.id}
              className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
            >
              {columns.map((col, ci) => (
                <td key={col.key} className="px-0 py-0">
                  <Link
                    href={getHref(row)}
                    className={cn('block px-4 py-3 text-sm', ci === 0 ? 'font-medium text-foreground' : 'text-muted-foreground')}
                  >
                    {col.render(row)}
                  </Link>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
