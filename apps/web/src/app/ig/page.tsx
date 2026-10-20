import type { Metadata } from "next"
import { permanentRedirect } from "next/navigation"

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
 *   - `permanentRedirect("/playbook")` throws a `NEXT_REDIRECT`
 *     signal that the App Router catches at the framework
 *     boundary. The response is already streaming by that point, so
 *     it cannot carry an HTTP redirect: the framework injects a
 *     `<meta http-equiv="refresh">` into the page instead. The
 *     delay is Next's, not ours: `0` for a permanent redirect, `1`
 *     for a temporary one. Measured against a running dev server,
 *     `/ig` answers 200 with `content="0;url=/playbook"`. Under
 *     plain `redirect()` the same page carried `content="1;url=..."`
 *     and sat on a blank screen for a second on the way to the
 *     funnel. A real 307 would need a `redirects()` entry in
 *     `next.config.ts` or a route handler; both are already in use
 *     in this app, but pages were chosen over them deliberately.
 *   - Real social-media destinations are NOT supported here.
 *     Swapping the target for `https://instagram.com/...` would no
 *     longer be a funnel alias. If the team ever wants that, this
 *     file becomes a one-line swap.
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
  permanentRedirect("/playbook")
}
