import { Skeleton } from "@workspace/ui/components/skeleton"

export default function ChangelogLoading() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mb-8 space-y-2 border-b border-border pb-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>

      <div className="border border-border bg-background rounded-none">
        <ul className="m-0 grid list-none grid-cols-4 gap-x-6 gap-y-0 p-0 lg:grid-cols-12 [&>li:last-of-type]:before:h-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className={
                "col-span-full grid grid-cols-subgrid items-baseline gap-6 " +
                "lg:col-start-4 lg:col-span-8 relative " +
                "before:content-[''] before:block before:h-[calc(100%+1px)] " +
                "before:w-px before:bg-border before:rounded-sm " +
                "before:absolute before:top-[25px] " +
                "after:content-[''] after:absolute after:block after:h-px " +
                "after:w-3 after:bg-border after:rounded-sm after:top-[25px]"
              }
            >
              <div className="col-span-1 lg:col-span-2">
                <span className="ml-6 flex items-center gap-3 text-sm font-medium">
                  <Skeleton className="h-4 w-24" />
                </span>
              </div>
              <div className="col-span-3 flex flex-col gap-3 p-6 lg:col-span-6">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="size-4 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
