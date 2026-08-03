import { Skeleton } from "@workspace/ui/components/skeleton"

/**
 * Loading state for /templates and /templates/[slug].
 *
 * Renders a skeleton grid that mirrors the real layout so the
 * streamed HTML feels stable when it swaps in. Card height matches
 * the real `h-48` so the page doesn't shift on hydration.
 */
const Loading = () => {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10 flex flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </header>
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="h-48 w-full" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Loading
