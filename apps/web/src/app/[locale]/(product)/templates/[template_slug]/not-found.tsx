import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

/**
 * 404 for /templates/[slug] when the slug doesn't exist.
 *
 * Triggered by `notFound()` in page.tsx. RSC, no fetch — the parent
 * has already decided the slug is invalid.
 */
const TemplateNotFound = () => {
  return (
    <section className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-heading-32 tracking-tight">Template not found</h1>
      <p className="text-copy-16 text-muted-foreground mt-4">
        The template you requested is not in the catalog. It may have been
        renamed or removed.
      </p>
      <Button asChild className="mt-8">
        <Link href="/templates">Browse all templates</Link>
      </Button>
    </section>
  )
}

export default TemplateNotFound
