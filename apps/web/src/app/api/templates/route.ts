import { NextResponse } from "next/server"

/**
 * Templates endpoint for the DeesseJS CLI.
 *
 * The CLI fetches this on every `deessejs list` / `info` / `init` invocation.
 * We cache aggressively so repeat calls are CDN-served:
 *   - s-maxage=3600: shared cache (CDN) holds it for 1 hour
 *   - stale-while-revalidate=86400: while revalidating, serve stale for up to 24h
 *
 * Once `apps/web/src/data/templates.ts` lands, replace the body with:
 *   import { templates } from "@/data/templates"
 *   return NextResponse.json({ templates }, { headers: CACHE_HEADERS })
 *
 * NOTE: In V1, this returns a hardcoded placeholder array so the route
 * compiles standalone. Once `apps/web/src/data/templates.ts` lands (the
 * V1 web-app workstream), replace the body with:
 *
 *   import { templates } from "@/data/templates"
 *   return NextResponse.json(
 *     { templates },
 *     { headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
 *   )
 */

type Template = {
  slug: string
  name: string
  description: string
  owner: string
  repo: string
  license: string
  category: string
  labels: string[]
  image?: string
}

const PLACEHOLDER_TEMPLATES: Template[] = []

const CACHE_HEADERS = {
  "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { templates: PLACEHOLDER_TEMPLATES },
    { headers: CACHE_HEADERS },
  )
}