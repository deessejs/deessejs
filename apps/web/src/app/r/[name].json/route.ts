import { NextResponse } from "next/server"

import { ITEMS } from "@/registry/items"

/**
 * GET /r/<name>.json — single-item resolver for the shadcn
 * registry CLI.
 *
 * The `[name]` segment captures the dotted path
 * `components/<slug>` or `blocks/<slug>` (e.g. `button.json`
 * resolves to `name = "button"`, `components/button.json`
 * resolves to `name = "components/button"`). We strip the
 * `.json` suffix and split on the optional `components/` or
 * `blocks/` namespace prefix, then look the slug up in
 * `ITEMS.components` or `ITEMS.blocks` accordingly.
 *
 *   GET /r/button.json                 → ITEMS.components.button
 *   GET /r/components/button.json      → ITEMS.components.button
 *   GET /r/blocks/<anything>.json      → 404 (no blocks shipped)
 *
 * The route lives at the canonical Next.js pattern
 * `app/r/[name].json/route.ts`. Note that because of the
 * literal `.json` directory suffix, Next.js 16 types the
 * dynamic segment as opaque (`params: Promise<Record<string,
 * string | string[]>>`), so we read the value defensively
 * rather than relying on a named key.
 *
 * Schema: https://ui.shadcn.com/docs/registry/registry-item-json
 *
 * The full catalogue index (used for `shadcn list` / `search`)
 * lives at `/r/registry.json` and is served from
 * `app/r/registry.json/route.ts`.
 */
export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: Promise<Record<string, string | string[]>>
  },
) {
  const resolved = await params
  const rawName = resolved["name"]
  const name = Array.isArray(rawName) ? rawName[0] ?? "" : rawName ?? ""
  const raw = name.endsWith(".json") ? name.slice(0, -5) : name
  const [maybeNamespace, slug] = raw.split("/")
  const namespace =
    maybeNamespace === "components" || maybeNamespace === "blocks"
      ? maybeNamespace
      : null
  const lookup = namespace ? slug : raw
  const collection =
    namespace === "components"
      ? ITEMS.components
      : namespace === "blocks"
        ? ITEMS.blocks
        : ITEMS.components
  const item = collection[lookup as keyof typeof collection]
  if (!item) {
    return new NextResponse("Not found", { status: 404 })
  }
  return NextResponse.json(item)
}
