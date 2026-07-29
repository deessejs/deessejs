"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to your error reporting service
    console.error(error)
  }, [error])

  return (
    <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-6xl font-bold text-destructive/30">500</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        An unexpected error occurred. We&apos;ve been notified and are looking
        into it.
      </p>
      <div className="mt-8 flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button onClick={reset}>Try again</Button>
      </div>
    </section>
  )
}
