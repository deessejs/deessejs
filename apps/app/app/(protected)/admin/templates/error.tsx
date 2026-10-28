"use client"

import { Button } from "@workspace/ui/components/button"

export default function TemplatesError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-semibold">Templates could not be loaded</h1>
      <p className="text-sm text-muted-foreground">Try again in a moment.</p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
