import Link from 'next/link'

interface ResourceEmptyStateProps {
  showAll: boolean
  basePath: string
  title?: string
  description?: string
  actionHref?: string
  actionLabel?: string
}

export function ResourceEmptyState({
  showAll,
  basePath,
  title,
  description,
  actionHref,
  actionLabel,
}: ResourceEmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/40 px-6 py-8 text-center">
      <p className="text-sm font-medium text-foreground">
        {title || (showAll ? 'No records yet.' : 'No active records.')}
      </p>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
        {actionHref && actionLabel && (
          <Link href={actionHref} className="text-zo-purple hover:underline">
            {actionLabel}
          </Link>
        )}
        {!showAll && (
          <Link href={`${basePath}?view=all`} className="text-muted-foreground hover:text-zo-purple">
            View all
          </Link>
        )}
      </div>
    </div>
  )
}
