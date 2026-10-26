import { ORPCError } from "@orpc/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { serverEnv } from "@workspace/env/server"

import { apiBaseUrl } from "@/lib/preview-urls"
import { createOrpcClient } from "@/lib/orpc"

/**
 * POST /api/playbook/signup — the signup proxy of the marketing site.
 *
 * The browser does not call the API directly. A preview deployment of
 * `deessejs-app` is protected by Vercel, and Vercel answers a CORS
 * preflight with a redirect to its sign-in page. The browser cannot
 * follow a redirect inside a preflight, so it refuses the response
 * and the POST never leaves the page.
 *
 * This handler runs on the server, on the same origin as the page, so
 * the browser call is same-origin: no preflight, no CORS. The server
 * call to the API carries the header Vercel's deployment protection
 * expects, and the API answers as it would for any other caller.
 *
 * The response contract is the wire code the API returned, so the
 * form branches on the same codes it used to branch on.
 */

const signupInput = z.object({
  email: z.string().email(),
  consentMarketing: z.boolean().optional().default(false),
})

/** The wire codes the API documents for this procedure. */
const STATUS_BY_CODE: Record<string, number> = {
  RATE_LIMITED: 429,
  DUPLICATE_SIGNUP: 409,
  EMAIL_SEND_FAILED: 502,
  BAD_REQUEST: 400,
  INVALID_EMAIL: 400,
}

export async function POST(request: Request): Promise<Response> {
  let input: z.infer<typeof signupInput>
  try {
    input = signupInput.parse(await request.json())
  } catch {
    return NextResponse.json(
      {
        code: "BAD_REQUEST",
        message: "That email looks off. Please double-check it.",
      },
      { status: 400 },
    )
  }

  const headers: Record<string, string> = {}

  // The bypass secret of the `deessejs-app` project. Without it, a
  // call to a protected preview deployment comes back as a redirect to
  // Vercel's sign-in page.
  const bypassSecret = serverEnv.API_PROTECTION_BYPASS_SECRET
  if (bypassSecret) {
    headers["x-vercel-protection-bypass"] = bypassSecret
  }

  // Vercel overwrites the client-supplied `x-forwarded-for` at the
  // edge, so the value read here is the visitor's address. Forwarding
  // it keeps the API's rate limit per visitor: the API reads the
  // first entry of the chain, and Vercel appends the proxy hops to
  // what we send.
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    headers["x-forwarded-for"] = forwardedFor
  }

  try {
    const client = createOrpcClient(apiBaseUrl, { headers })
    const result: unknown = await client.playbook.signup(input)

    if (isSignupResult(result)) {
      return NextResponse.json({ ok: true })
    }

    // The client resolves with `undefined` when the answer was not
    // an RPC result at all. A redirect to the sign-in page, which is
    // what Vercel's deployment protection answers to an
    // unauthenticated call, lands here. Reporting a success would
    // tell the visitor the email is on its way when nothing was
    // sent.
    const code = readCode(result)
    const status = (code && STATUS_BY_CODE[code]) || 502
    return NextResponse.json(
      {
        code: code ?? "EMAIL_SEND_FAILED",
        message:
          readMessage(result) ??
          "Couldn't send the email right now. Please try again in a few minutes.",
      },
      { status },
    )
  } catch (error) {
    // `ORPCError` declares a `Symbol.hasInstance` that works across
    // dependency graphs, so the check holds even though the error was
    // constructed inside the oRPC client.
    const isApiError = error instanceof ORPCError
    const code = isApiError ? error.code : undefined
    const status = (code && STATUS_BY_CODE[code]) || 502
    return NextResponse.json(
      {
        code: code ?? "EMAIL_SEND_FAILED",
        message:
          (isApiError ? error.message : undefined) ??
          "Couldn't send the email right now. Please try again in a few minutes.",
      },
      { status },
    )
  }
}

/** The result the API returns when the signup went through. */
function isSignupResult(value: unknown): value is { ok: true } {
  return typeof value === "object" && value !== null && "ok" in value
}

/** The wire code of an error that reached the caller as a value. */
function readCode(value: unknown): string | undefined {
  if (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof value.code === "string"
  ) {
    return value.code
  }
  return undefined
}

function readMessage(value: unknown): string | undefined {
  if (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message
  }
  return undefined
}
