import { NextResponse } from "next/server"

import { CATALOGUE } from "@/registry/catalogue"

/**
 * GET /r/registry.json — the catalogue index.
 *
 * Shape: https://ui.shadcn.com/docs/registry/registry-json
 */
export async function GET() {
  return NextResponse.json(CATALOGUE)
}