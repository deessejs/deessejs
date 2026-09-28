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
 * Schema: https://ui.shadcn.com/docs/registry/registry-item-json
 *
 * The full catalogue index (used for `shadcn list` / `search`)
 * lives at `/r/registry.json` and is served from
 * `app/r/registry.json/route.ts`.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params
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
