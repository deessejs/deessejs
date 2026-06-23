import type { NextRequest } from "next/server"
import { handle } from "hono/vercel"

import { app } from "@deessejs/api"

/**
 * Catch-all Route Handler that mounts the Hono app from `@deessejs/api`.
 *
 *   /api/auth/*         → Better Auth handler (mounted inside Hono)
 *   /rpc/*              → oRPC RPCHandler
 *   /api/v1/*           → oRPC OpenAPIHandler + Scalar UI at /api/v1/docs
 *
 * Single Vercel Function for the whole `/api/*` + `/rpc/*` surface.
 *
 * @see docs/internal/architecture/11-packages/api/hosting.md
 */

/**
 * The route-level maxDuration. 1800s (30 min) is the GA ceiling for
 * Node.js + Vercel Fluid Compute since 2026-06-15. Sufficient for any
 * sync API call, AI streaming, and admin operations. > 1800s is beta —
 * Trigger.dev handles long jobs.
 */
export const maxDuration = 1800

/**
 * `handle(app)` from hono/vercel is typed `(req: Request) => Response |
 * Promise<Response>`, which is too narrow for Next.js 15+ App Router
 * (expects `NextRequest | Request` + an optional `ctx` param, and the
 * `void` return union member). The cast bridges the gap. Runtime is
 * unaffected. The fix has been "incoming" in Hono (PRs #4878 / #4888 /
 * #4964 all closed unmerged as of 2026-06-23).
 *
 * @see .claude/agent-memory/tech-lead/project-hono-vercel-typing-issue.md
 */
type NextHandler = (
  req: NextRequest | Request,
  ctx?: unknown,
) => Response | Promise<Response>

const handler = handle(app) as unknown as NextHandler

// Hono routes dispatch by method internally. We export every method
// Next.js supports so the catch-all covers the full HTTP surface.
// OPTIONS is auto-handled by Next.js when not exported (it generates
// the Allow header from the other exported methods), so we skip it.
export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const HEAD = handler
