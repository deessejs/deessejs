"use client"

import { useEffect } from "react"

import { Button } from "@workspace/ui/components/button"

/**
 * Segment-level error boundary for /enterprise.
 *
 * Mirrors the shape of `apps/web/src/app/(product)/templates/error.tsx`:
 * does NOT expose `error.message` (avoids leaking backend detail),
 * offers a single `Try again` reset, and uses the standard DS
 * typography (`text-heading-32` / `text-copy-16`).
 */
export default function EnterpriseError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    // Log to your error reporting service
    console.error(error)
  }, [error])

  return (
    <section className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-heading-32 tracking-tight">
        Something went wrong
      </h1>
      <p className="text-copy-16 text-muted-foreground mt-4">
        We could not load the enterprise page. Check your connection and
        try again, or email{" "}
        <a
          href="mailto:support@deessejs.com?subject=Enterprise%20page%20error"
          className="underline underline-offset-4 hover:text-foreground"
        >
          support@deessejs.com
        </a>{" "}
        if the problem persists.
      </p>
      <Button onClick={reset} className="mt-8">
        Try again
      </Button>
    </section>
  )
}
