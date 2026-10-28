/**
 * Snippets for the Code tab on every
 * `/components/[category]/[component]` page. Each entry is a
 * shadcn-style usage example that the consumer can copy-paste.
 *
 * Snippets are exhaustive over `CatalogueComponent["slug"]` —
 * the trailing `satisfies` check turns a missing slug into a
 * compile error.
 *
 * Only the shipped registry items (currently `button`, `input`,
 * `badge`) carry a real installable snippet. The other 12 slugs
 * are documented on `/components` but their primitives are not
 * yet in `@workspace/ui` — for those, the snippet shown in the
 * Code tab is a uniform placeholder so visitors don't see code
 * that references components they can't install.
 *
 * V3 will replace the shipped snippets with parsed source from
 * `packages/ui/src/components/<slug>.tsx`.
 */

import type { CatalogueComponent } from "./catalogue"

const PREVIEW_PLACEHOLDER = `// Source coming in V3.
//
// This component is documented on /components but its primitive
// has not landed in @workspace/ui yet. The code samples below
// preview the API shape; the registry install will go live once
// the primitive is ready.
`

const SNIPPETS = {
  // ── button ──────────────────────────────────────────────────
  button: `import { Button } from "@workspace/ui/components/button"

export function Example() {
  return <Button>Click me</Button>
}`,

  "button-group": PREVIEW_PLACEHOLDER,

  "split-button": PREVIEW_PLACEHOLDER,

  "icon-button": PREVIEW_PLACEHOLDER,

  "loading-button": PREVIEW_PLACEHOLDER,

  // ── input ───────────────────────────────────────────────────
  input: `import { Input } from "@workspace/ui/components/input"

export function Example() {
  return (
    <Input type="email" placeholder="you@deessejs.com" className="max-w-sm" />
  )
}`,

  "input-search": PREVIEW_PLACEHOLDER,

  "input-otp": PREVIEW_PLACEHOLDER,

  "input-tags": PREVIEW_PLACEHOLDER,

  textarea: PREVIEW_PLACEHOLDER,

  // ── badge ───────────────────────────────────────────────────
  badge: `import { Badge } from "@workspace/ui/components/badge"

export function Example() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
    </div>
  )
}`,

  "badge-dot": PREVIEW_PLACEHOLDER,

  "badge-removable": PREVIEW_PLACEHOLDER,

  "badge-icon": PREVIEW_PLACEHOLDER,

  "badge-numeric": PREVIEW_PLACEHOLDER,
} satisfies Record<CatalogueComponent["slug"], string>

const SNIPPET_BY_SLUG = new Map(Object.entries(SNIPPETS))

export function getComponentSnippet(slug: CatalogueComponent["slug"]): string {
  return SNIPPET_BY_SLUG.get(slug) ?? PREVIEW_PLACEHOLDER
}
