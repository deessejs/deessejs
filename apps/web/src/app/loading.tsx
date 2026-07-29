import { Skeleton } from "@workspace/ui/components/skeleton"

export default function Loading() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Header skeleton */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>

      {/* Tags row skeleton */}
      <div className="mb-8 flex flex-wrap gap-2 border-y border-border/40 py-4">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-14" />
        <div className="ml-auto">
          <Skeleton className="h-8 w-48" />
        </div>
      </div>

      {/* Featured post skeleton */}
      <div className="mb-12 overflow-hidden rounded-xl border border-border/40">
        <Skeleton className="aspect-video w-full" />
        <div className="bg-muted/20 p-8 space-y-3">
          <div className="flex gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>

      {/* Post grid skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border/40">
            <Skeleton className="aspect-video w-full" />
            <div className="p-6 space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
