import { Skeleton } from '@/components/ui/skeleton'

// Generic skeleton for internal list/detail pages — shows instantly on route
// transitions while the server component fetches data.
export default function InternalLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <Skeleton className="h-8 w-40" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
