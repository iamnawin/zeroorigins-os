import Link from 'next/link'

interface ResourceEmptyStateProps {
  showAll: boolean
  basePath: string
}

export function ResourceEmptyState({ showAll, basePath }: ResourceEmptyStateProps) {
  return (
    <p className="text-sm text-muted-foreground text-center py-8">
      {showAll ? 'No records yet.' : 'No active records. '}
      {!showAll && (
        <Link href={`${basePath}?view=all`} className="text-zo-amber hover:underline">
          View all
        </Link>
      )}
    </p>
  )
}
