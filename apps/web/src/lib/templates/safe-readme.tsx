import { isValidElement } from "react"
import type { Components, Options } from "react-markdown"

import rehypePrettyCode, { type Options as CodeOptions } from "rehype-pretty-code"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import remarkGfm from "remark-gfm"

import { CopyButton } from "../../components/templates/copy-button"

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
 *      not in the allow-list. Catches `javascript:`, `data:text/html,...`,
 *      `vbscript:`, `file:`, etc.
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
 * Defense layer two of three (see the file header for the full threat
 * model). Returns the URL when its protocol is allow-listed; returns
 * `undefined` to tell `react-markdown` to drop the URL entirely.
 *
 * Pure function — exported for unit testing.
 */
export const safeUrlTransform = (url: string): string | undefined => {
  // Anchor links (e.g. `#installation`) — no protocol to validate,
  // accept as-is. Same for root-relative paths.
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

/**
 * Structural shape of any element the walker may descend into. We
 * don't import ReactElement here because that requires the full
 * $$typeof + type + key shape — which forces test code to
 * fabricate complex objects. The walker only reads `.props.children`,
 * so the structural type is sufficient.
 */
type TreeElement = { props?: { children?: unknown } }

/**
 * Walk a react-markdown node tree and concatenate every leaf string.
 * Used by the pre component override to grab the raw source code
 * from the rendered shiki output, so the copy button can put it on
 * the clipboard.
 *
 * Takes an `isTreeElement` predicate rather than importing React at
 * the type level — keeps this file importing only the React bits it
 * actually needs at runtime.
 */
export const collectStrings = (
  node: unknown,
  isTreeElement: (value: unknown) => value is TreeElement,
): string => {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) {
    return node.map((n) => collectStrings(n, isTreeElement)).join("")
  }
  if (isTreeElement(node)) {
    return collectStrings(node.props?.children, isTreeElement)
  }
  return ""
}

/**
 * Options for `rehype-pretty-code` (shiki integration).
 *
 * Themes: `github-light` + `github-dark` are the consensual SaaS-docs
 * defaults. Dual themes use CSS variables; the dark swap is controlled by
 * a single rule in `globals.css` that reads `html.dark .shiki span`.
 *
 * `defaultLang: "bash"` because the upstream `saas-template` README is
 * overwhelmingly bash-fenced. Unfenced blocks inherit this default,
 * matching GitHub's behaviour.
 *
 * `keepBackground: false` — the theme sets the background color, but we
 * want our `Prose` `[&_pre]:bg-muted/30` to win so blocks match the rest
 * of the page. The token colors stay.
 *
 * **No transformers.** The official `@rehype-pretty/transformers/copy-button`
 * uses an inline `onclick="navigator.clipboard.writeText(...)"` attribute —
 * `rehype-sanitize` (defaultSchema) strips `on*` handlers, so the button
 * would be visually present but non-functional. We instead build the copy
 * button as a real Client Component (`CopyButton`) wired through
 * `components.pre` below. The functionality is identical, the security
 * model is cleaner, and the button is visible to React (state, focus,
 * a11y tree).
 */
const codeblockOptions: CodeOptions = {
  theme: { light: "github-light", dark: "github-dark" },
  defaultLang: "bash",
  keepBackground: false,
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
  // GFM tables — wrap the rendered <table> in a horizontally-scrollable
  // container so wide tables don't blow out the narrow README column on
  // mobile. The negative margin reclaims the gutter that Prose's
  // `my-6` adds; on `sm` and up we collapse the margin back. Same
  // wrapper shape as apps/web/src/app/(marketing)/pricing/page.tsx.
  // Cell-level styling (padding, borders, alignment) lives in Prose via
  // Tailwind arbitrary variants — we do not re-style here.
  table: ({ children }) => (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 my-6">
      {children}
    </div>
  ),
  // Code blocks — shiki's pre element carries token-colored code
  // content. We wrap it in a div (so we can position the copy
  // button absolutely against the block, not against the page) and
  // append the existing client-side CopyButton. The "copied!" toggle
  // is managed by CopyButton internally; this Server Component
  // wrapper just lays out the markup.
  pre: ({ children, ...rest }) => {
    const codeText = collectStrings(children, isValidElement)
    return (
      <div className="group/codeblock relative">
        <pre {...rest}>{children}</pre>
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover/codeblock:opacity-100">
          <CopyButton
            value={codeText}
            variant="ghost"
            size="sm"
            ariaLabel="Copy code"
          />
        </div>
      </div>
    )
  },
}

/**
 * Default options passed to `<Markdown>` in `TemplateReadme`. Exported so a
 * colocated test can pin the exact configuration without rendering through
 * the React tree.
 *
 * **Plugin order matters.** Shiki must run BEFORE `rehype-sanitize` so
 * the sanitizer sees the highlighted AST (with `<span>` styling
 * attributes) and applies the allow-list to it. Sanitize stays last as
 * the defense-in-depth final pass — anything shiki emits that escapes
 * the defaultSchema gets stripped.
 */
export const safeReadmeOptions: Options = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    [rehypePrettyCode, codeblockOptions],
    [rehypeSanitize, defaultSchema],
  ],
  urlTransform: safeUrlTransform,
  components,
}
