import { Skeleton } from "@workspace/ui/components/skeleton"

export default function OrganizationTemplatesLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-7xl flex-col gap-6"
      aria-busy="true"
    >
      <header className="flex flex-col gap-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </header>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
      <span className="sr-only">Loading organization templates</span>
    </div>
  )
}
