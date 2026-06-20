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
    <>
      <div className="space-y-2 md:hidden">
        {rows.map(row => {
          const [primary, ...details] = columns
          return (
            <Link key={row.id} href={getHref(row)} className="block rounded-lg border border-border bg-card/70 p-3 transition-colors hover:border-zo-purple/35 hover:bg-muted/30">
              <div className="min-w-0 text-sm font-semibold leading-5 text-foreground">{primary.render(row)}</div>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {details.map(col => (
                  <div key={col.key} className="min-w-0">
                    <dt className="text-[10px] font-semibold uppercase text-muted-foreground">{col.label}</dt>
                    <dd className="mt-0.5 truncate text-xs text-muted-foreground">{col.render(row)}</dd>
                  </div>
                ))}
              </dl>
            </Link>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full min-w-[720px] text-sm md:min-w-0">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map(col => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase text-muted-foreground"
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
                className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
              >
                {columns.map((col, ci) => (
                  <td key={col.key} className="px-0 py-0">
                    <Link
                      href={getHref(row)}
                      className={cn('block px-3 py-2.5 text-sm', ci === 0 ? 'font-medium text-foreground' : 'text-muted-foreground')}
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
    </>
  )
}
