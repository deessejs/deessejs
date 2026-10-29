import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto"
import { serverEnv } from "@workspace/env/server"
import { z } from "zod"

const oauthStatePayload = z.object({
  state: z.string().min(32),
  codeVerifier: z.string().min(32),
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  expiresAt: z.number().int().positive(),
})

const MAX_STATE_AGE_SECONDS = 10 * 60
type OAuthStatePayload = z.infer<typeof oauthStatePayload>

function secret(): string {
  return (
    serverEnv.BETTER_AUTH_SECRET ??
    serverEnv.AUTH_SECRET ??
    "deessejs-github-app-development-only"
  )
}

function sign(value: string): Buffer {
  return createHmac("sha256", secret()).update(value).digest()
}

export function createGitHubOAuthState(input: {
  organizationId: string
  userId: string
}): OAuthStatePayload {
  const now = Math.floor(Date.now() / 1000)
  return {
    state: randomBytes(32).toString("base64url"),
    codeVerifier: randomBytes(32).toString("base64url"),
    organizationId: input.organizationId,
    userId: input.userId,
    expiresAt: now + MAX_STATE_AGE_SECONDS,
  }
}

export function signGitHubOAuthState(payload: OAuthStatePayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${encoded}.${sign(encoded).toString("base64url")}`
}

export function readGitHubOAuthState(value: string): OAuthStatePayload | null {
  if (value.length > 2048) return null
  const [encoded, providedSignature, extra] = value.split(".")
  if (!encoded || !providedSignature || extra !== undefined) return null

  const expectedSignature = sign(encoded)
  const actualSignature = Buffer.from(providedSignature, "base64url")
  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return null
  }

  try {
    const parsed = oauthStatePayload.safeParse(
      JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"))
    )
    if (!parsed.success) return null
    const now = Math.floor(Date.now() / 1000)
    if (
      parsed.data.expiresAt <= now ||
      parsed.data.expiresAt - now > MAX_STATE_AGE_SECONDS
    ) {
      return null
    }
    return parsed.data
  } catch {
    return null
  }
}

export function createGitHubPkceChallenge(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url")
}
