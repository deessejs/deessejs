import { Skeleton } from "@workspace/ui/components/skeleton"

export default function ChangelogLoading() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>

      <div className="mb-12 flex items-center gap-2 border-b border-border/40 pb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-24" />
        <div className="ml-auto">
          <Skeleton className="h-8 w-48" />
        </div>
      </div>

      <div className="space-y-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-3 pl-4 border-l-2 border-border/40">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="pl-6 space-y-1">
                    <Skeleton className="h-3 w-64" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
