import type { Metadata } from "next"
import { redirect } from "next/navigation"

/**
 * `/ig` — Instagram funnel alias.
 *
 * Internal-redirect page that lands visitors on `/playbook`. The
 * URL is for sharing from the brand's Instagram profile (and
 * anywhere else short, brand-clean URLs are needed). It is a
 * single-purpose capture surface — never intended to link out to
 * instagram.com.
 *
 * Implementation notes:
 *   - Server component, `force-dynamic`, noindex. The dynamic flag
 *     guarantees the redirect is computed on every request and
 *     never served from a stale build cache, which matters for
 *     any future analytics / per-platform variant routing layer.
 *   - `redirect("/playbook")` from `next/navigation` throws a
 *     `NEXT_REDIRECT` signal that the App Router catches at the
 *     framework boundary and converts into an HTTP 307 response
 *     to the destination.
 *   - Real social-media destinations are NOT supported here.
 *     Changing `redirect("/playbook")` to `redirect("https://instagram.com/...")`
 *     would no longer be a funnel alias. If the team ever wants
 *     that, this file becomes a one-line swap.
 */
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Playbook",
  description: "DeesseJS playbook — free PDF.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function IgPage() {
  redirect("/playbook")
}
