import { NextResponse } from "next/server"

import { ITEMS } from "@/registry/items"

/**
 * GET /r/blocks/[name].json — multi-file `registry:block`
 * items. V1 returns 404 (no blocks shipped yet). V2 expands
 * this with lifted inline sections of the marketing pages.
 *
 * Schema: https://ui.shadcn.com/docs/registry/registry-item-json
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params
  const item = ITEMS.blocks[name as keyof typeof ITEMS.blocks]
  if (!item) {
    return new NextResponse("Not found", { status: 404 })
  }
  return NextResponse.json(item)
}