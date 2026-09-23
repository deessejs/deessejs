"use client"

import { Button } from "@workspace/ui/components/button"

/**
 * Error boundary for /templates and /templates/[slug].
 *
 * Client component (required by Next.js for error boundaries). We do
 * NOT surface `error.message` to the user: that path leaks backend
 * detail. The "Try again" button calls Next.js' reset(), which
 * re-runs the parent RSC and re-fetches.
 */
const TemplatesError = ({
  reset,
}: {
  error: Error
  reset: () => void
}) => {
  return (
    <section className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-heading-32 tracking-tight">
        Couldn&apos;t load templates
      </h1>
      <p className="text-copy-16 text-muted-foreground mt-4">
        Something went wrong fetching the catalog. Check your connection
        and try again.
      </p>
      <Button onClick={reset} className="mt-8">
        Try again
      </Button>
    </section>
  )
}

export default TemplatesError
