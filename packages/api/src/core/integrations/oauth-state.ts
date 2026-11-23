import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { serverEnv } from "@workspace/env/server"
import { z } from "zod"

const payloadSchema = z.object({
  state: z.string().min(32),
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  expiresAt: z.number().int().positive(),
})
type StatePayload = z.infer<typeof payloadSchema>
const maxAge = 10 * 60

function stateSecret() {
  const secret = serverEnv.BETTER_AUTH_SECRET
  if (!secret)
    throw new Error("A Better Auth secret is required for OAuth state")
  return secret
}

function signature(value: string) {
  return createHmac("sha256", stateSecret()).update(value).digest()
}

export function createIntegrationOAuthState(input: {
  organizationId: string
  userId: string
}): StatePayload {
  return {
    ...input,
    state: randomBytes(32).toString("base64url"),
    expiresAt: Math.floor(Date.now() / 1000) + maxAge,
  }
}

export function signIntegrationOAuthState(payload: StatePayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${encoded}.${signature(encoded).toString("base64url")}`
}

export function readIntegrationOAuthState(value: string): StatePayload | null {
  if (value.length > 2048) return null
  const [encoded, provided, extra] = value.split(".")
  if (!encoded || !provided || extra !== undefined) return null
  const expected = signature(encoded)
  const actual = Buffer.from(provided, "base64url")
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null
  }
  try {
    const parsed = payloadSchema.safeParse(
      JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"))
    )
    const now = Math.floor(Date.now() / 1000)
    if (
      !parsed.success ||
      parsed.data.expiresAt <= now ||
      parsed.data.expiresAt - now > maxAge
    ) {
      return null
    }
    return parsed.data
  } catch {
    return null
  }
}
