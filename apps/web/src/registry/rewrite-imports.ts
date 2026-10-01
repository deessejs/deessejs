/**
 * Rewrites `@workspace/ui/*` imports in source files to the
 * shadcn-standard paths a consumer expects.
 *
 * V1 rules:
 *   @workspace/ui/components/<X>  →  @/components/ui/<X>
 *   @workspace/ui/lib/utils       →  @/lib/utils
 *
 * The consumer does not have `@workspace/ui` in their
 * `node_modules` — it's an internal DeesseJS package. New
 * rules can be added as more items ship (e.g.
 * `@workspace/ui/lib/colors`).
 */
const RULES: Array<[RegExp, string]> = [
  [/@workspace\/ui\/components\/([a-z-]+)/g, "@/components/ui/$1"],
  [/@workspace\/ui\/lib\/utils/g, "@/lib/utils"],
]

export function rewriteImports(source: string): string {
  let out = source
  for (const [pattern, replacement] of RULES) {
    out = out.replace(pattern, replacement)
  }
  return out
}