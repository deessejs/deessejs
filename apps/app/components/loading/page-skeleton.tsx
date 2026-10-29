import { Skeleton } from "@workspace/ui/components/skeleton"

type PageSkeletonVariant = "auth" | "cards" | "detail" | "form" | "table"

export function PageSkeleton({
  label,
  variant = "cards",
  count = 6,
}: {
  label: string
  variant?: PageSkeletonVariant
  count?: number
}) {
  const rows = Array.from({ length: count }, (_, index) => index)

  if (variant === "auth") {
    return (
      <div className="mx-auto w-full max-w-md" aria-busy="true">
        <span className="sr-only">{label}</span>
        <div className="flex flex-col gap-6 rounded-xl border bg-card p-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="flex flex-col gap-4">
            {rows.slice(0, 3).map((row) => (
              <Skeleton key={row} className="h-10 w-full" />
            ))}
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-4 w-48 self-center" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <span className="sr-only">{label}</span>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-52 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </header>

      {variant === "cards" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <CardSkeleton key={row} />
          ))}
        </div>
      )}

      {variant === "table" && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full max-w-sm" />
          <div className="rounded-lg border p-4">
            <Skeleton className="mb-4 h-8 w-full" />
            {rows.map((row) => (
              <Skeleton key={row} className="mb-3 h-12 w-full last:mb-0" />
            ))}
          </div>
        </div>
      )}

      {variant === "form" && (
        <div className="flex flex-col gap-4">
          {[0, 1].map((card) => (
            <div
              key={card}
              className="flex flex-col gap-5 rounded-lg border p-6"
            >
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-80 max-w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-9 w-28 self-end" />
            </div>
          ))}
        </div>
      )}

      {variant === "detail" && (
        <div className="flex flex-col gap-5 rounded-lg border p-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <div className="grid gap-5 sm:grid-cols-2">
            {rows.slice(0, 6).map((row) => (
              <div key={row} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function CardGridSkeleton({
  label,
  count = 3,
}: {
  label: string
  count?: number
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  )
}

export function RowsSkeleton({
  label,
  count = 4,
}: {
  label: string
  count?: number
}) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-md border p-3"
        >
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-20 shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function ProtectedShellSkeleton() {
  return (
    <div className="flex min-h-dvh" aria-busy="true">
      <span className="sr-only">Loading application</span>
      <aside className="hidden w-64 shrink-0 border-r p-4 md:block">
        <Skeleton className="mb-8 h-8 w-40" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="flex h-14 items-center border-b px-6">
          <Skeleton className="h-8 w-32" />
        </header>
        <section className="p-6">
          <PageSkeleton
            label="Loading page content"
            variant="cards"
            count={3}
          />
        </section>
      </main>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="flex min-h-40 flex-col gap-4 rounded-lg border p-5">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="mt-auto h-4 w-1/3" />
    </div>
  )
}
