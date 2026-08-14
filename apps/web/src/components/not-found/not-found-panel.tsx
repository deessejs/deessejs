import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

export type NotFoundAction =
  | { label: string; href: string }
  | null

/**
 * Shared 404 panel. Server component (no client state).
 *
 * Used by segment-level not-found.tsx files under (content), (product),
 * and (legal) to render a tailored "this specific thing is missing"
 * page with an action button that points back to the parent section.
 *
 * The root not-found.tsx (used when the URL is fully unknown) stays
 * bespoke — it has different copy and different layout.
 */
export function NotFoundPanel({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: NotFoundAction
}) {
  return (
    <section className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-heading-32 tracking-tight">{title}</h1>
      {body ? (
        <p className="text-copy-16 text-muted-foreground mt-4">{body}</p>
      ) : null}
      {action ? (
        <Button asChild className="mt-8">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </section>
  )
}
