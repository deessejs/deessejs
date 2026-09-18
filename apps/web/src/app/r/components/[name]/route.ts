import { NextResponse } from "next/server"

import { ITEMS } from "@/registry/items"

/**
 * GET /r/components/[name].json — single-file `registry:ui`
 * items. Each item reads its source file from disk at module
 * load time and rewrites `@workspace/ui/*` imports to
 * shadcn-standard paths.
 *
 * Schema: https://ui.shadcn.com/docs/registry/registry-item-json
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params
  const item = ITEMS.components[name as keyof typeof ITEMS.components]
  if (!item) {
    return new NextResponse("Not found", { status: 404 })
  }
  return NextResponse.json(item)
}