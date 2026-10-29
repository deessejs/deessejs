import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { serverEnv } from "@workspace/env/server"
import { z } from "zod"

const MAX_INSTALL_STATE_AGE_SECONDS = 10 * 60

const installStatePayload = z.object({
  version: z.literal(1),
  state: z.string().min(32),
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  expiresAt: z.number().int().positive(),
})

type InstallStatePayload = z.infer<typeof installStatePayload>

function stateSecret(): string {
  return (
    serverEnv.BETTER_AUTH_SECRET ??
    serverEnv.AUTH_SECRET ??
    "deessejs-github-app-development-only"
  )
}

function signature(value: string): Buffer {
  return createHmac("sha256", stateSecret()).update(value).digest()
}

export function createGitHubInstallState(input: {
  organizationId: string
  userId: string
}): InstallStatePayload {
  const payload: InstallStatePayload = {
    version: 1,
    state: randomBytes(32).toString("base64url"),
    organizationId: input.organizationId,
    userId: input.userId,
    expiresAt: Math.floor(Date.now() / 1000) + MAX_INSTALL_STATE_AGE_SECONDS,
  }
  return payload
}

export function signGitHubInstallState(payload: InstallStatePayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${encoded}.${signature(encoded).toString("base64url")}`
}

export function readGitHubInstallState(
  state: string
): InstallStatePayload | null {
  if (state.length > 2048) return null
  const [encoded, receivedSignature, extra] = state.split(".")
  if (!encoded || !receivedSignature || extra !== undefined) return null

  const expectedSignature = signature(encoded)
  const actualSignature = Buffer.from(receivedSignature, "base64url")
  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return null
  }

  try {
    const result = installStatePayload.safeParse(
      JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"))
    )
    if (!result.success) return null
    const payload = result.data
    const now = Math.floor(Date.now() / 1000)
    if (
      payload.expiresAt <= now ||
      payload.expiresAt - now > MAX_INSTALL_STATE_AGE_SECONDS
    ) {
      return null
    }
    return payload
  } catch {
    return null
  }
}
