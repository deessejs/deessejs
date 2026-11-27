import { Skeleton } from "@workspace/ui/components/skeleton"

export default function BrowseTemplatesLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <header className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-48" />
        ))}
      </div>
      <span className="sr-only">Loading public templates</span>
    </div>
  )
}
