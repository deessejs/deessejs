import { Skeleton } from "@workspace/ui/components/skeleton"

/**
 * Root streaming skeleton. Generic enough to fit the most common page
 * shape on the marketing site: a title + body paragraphs inside an
 * `<article>` or `<section>` with a centred max-width. Pages that
 * have a richer layout (templates index, blog index, changelog index)
 * override this with their own segment-level loading.tsx.
 */
export default function Loading() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </section>
  )
}
