import { Skeleton } from "@workspace/ui/components/skeleton"

export default function BrowseBlocksLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <header className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </header>
      <Skeleton className="h-10 max-w-xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-40" />
        ))}
      </div>
      <span className="sr-only">Loading public blocks</span>
    </div>
  )
}
