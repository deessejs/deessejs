import { Skeleton } from "@workspace/ui/components/skeleton"

/**
 * Streaming skeleton for /enterprise.
 *
 * Mirrors the real shape: hero (centered) + 3-cell trust grid.
 * Heights match the rendered cells so the streamed HTML does not
 * shift on hydration.
 */
export default function Loading() {
  return (
    <section
      data-testid="enterprise-loading"
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20"
    >
      <div className="border border-border bg-background rounded-none">
        <div className="flex flex-col items-center gap-6 border-b border-border p-6 text-center lg:p-16">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-3/4 max-w-3xl" />
          <Skeleton className="h-5 w-full max-w-2xl" />
          <Skeleton className="h-5 w-5/6 max-w-2xl" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="flex flex-col gap-4 p-6 lg:p-10 border-b border-border">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-2/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full border-t border-border md:border-l md:border-t-0" />
            <Skeleton className="h-24 w-full border-t border-border md:border-l md:border-t-0" />
          </div>
        </div>
      </div>
    </section>
  )
}
