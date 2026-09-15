import { NotFoundPanel } from "@/components/not-found/not-found-panel"

/**
 * Segment-level 404 for /enterprise.
 *
 * Reuses `NotFoundPanel` (used by `(content)`, `(product)`, `(legal)`
 * segments). The marketing group did not have its own not-found
 * before this page — `/enterprise` is the first marketing route to
 * opt in. The panel shape is `max-w-md px-6 py-24 text-center`
 * with an explicit back-to-enterprise action (same path — reload
 * would render the same content, so we send the visitor to /pricing
 * instead).
 */
export default function EnterpriseNotFound() {
  return (
    <NotFoundPanel
      title="Page not found"
      body="This enterprise resource does not exist or has been moved."
      action={{ label: "See pricing instead", href: "/pricing" }}
    />
  )
}
