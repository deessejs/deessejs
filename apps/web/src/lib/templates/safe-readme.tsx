import type { Components, Options } from "react-markdown"

import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import remarkGfm from "remark-gfm"

/**
 * Sanitize and render a README fetched from GitHub.
 *
 * Threat model: the README is owned by the upstream repository maintainer
 * (a third-party, not DeesseJS). We do not control its content. Any string
 * the maintainer pushes to `main` is rendered verbatim as Markdown unless
 * sanitized.
 *
 * Three layers of defense:
 *
 *   1. `rehype-sanitize` with `defaultSchema` (GitHub-style allow-list) drops
 *      dangerous nodes (e.g. `<script>`, `<iframe>`) and dangerous attributes
 *      (e.g. `onclick`).
 *   2. `safeUrlTransform` rejects `href` / `src` values whose URL protocol is
 *      not in the `ALLOWED_PROTOCOLS` set. This catches `javascript:`,
 *      `data:text/html,<script>...`, `vbscript:`, `file:`, etc. — vectors that
 *      `rehype-sanitize` mitigates but does not always fully eliminate across
 *      every plugin combination.
 *   3. `components.a` override pins `target="_blank"` and `rel="noopener noreferrer"`
 *      on every link so a tab is opened in a separate browsing context and the
 *      destination cannot reach back into our `window.opener`.
 *
 * No `rehype-raw`: we never revive raw HTML embedded in Markdown. This closes
 * one whole attack surface (the secure-by-default behavior of `react-markdown`)
 * at the cost of accepting that a README's `<details>` blocks or `<sub>` text
 * will render as literal characters — an acceptable trade for a marketing
 * surface that is not the canonical reading experience of the README.
 *
 * No `next-mdx-remote`: READMEs are Markdown, not MDX. `next-mdx-remote ≤ 5.x`
 * is vulnerable to CVE-2026-0969 (arbitrary RCE). Even at v6.0.0 the library
 * compiles MDX to executable code, which is the wrong shape for our input.
 */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"])

/**
 * Returns the URL when its protocol is allow-listed; returns `undefined` to
 * tell `react-markdown` to drop the URL entirely. Pure function — exported
 * for unit testing.
 */
export const safeUrlTransform = (url: string): string | undefined => {
  // Anchor links (e.g. `#installation`) — no protocol to validate, accept as-is.
  if (url.startsWith("#") || url.startsWith("/")) {
    return url
  }
  try {
    const parsed = new URL(url, "https://placeholder.invalid")
    return ALLOWED_PROTOCOLS.has(parsed.protocol) ? url : undefined
  } catch {
    return undefined
  }
}

const components: Components = {
  a: ({ href, children, ...rest }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
    >
      {children}
    </a>
  ),
}

/**
 * Default options passed to `<Markdown>` in `TemplateReadme`. Exported so a
 * colocated test can pin the exact configuration without rendering through
 * the React tree.
 */
export const safeReadmeOptions: Options = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [[rehypeSanitize, defaultSchema]],
  urlTransform: safeUrlTransform,
  components,
}
