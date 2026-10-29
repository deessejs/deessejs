import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
} from "node:crypto"
import { and, eq } from "drizzle-orm"
import { db, githubUserConnection } from "@workspace/database"
import { serverEnv } from "@workspace/env/server"
import { z } from "zod"

const githubTokenResponse = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  expires_in: z.number().positive().optional(),
  refresh_token_expires_in: z.number().positive().optional(),
  error: z.string().optional(),
})

const githubUserProfile = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1),
})

const GITHUB_API_VERSION = "2022-11-28"
const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 8 * 60 * 60

function encryptionKey(): Buffer {
  const value = serverEnv.GITHUB_APP_TOKEN_ENCRYPTION_KEY
  if (!value) throw new Error("GitHub token encryption key is not configured")
  const key = Buffer.from(value, "base64")
  if (key.length !== 32) {
    throw new Error("GitHub token encryption key must contain 32 bytes")
  }
  return key
}

export function encryptGitHubToken(token: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const ciphertext = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ])
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".")
}

export function decryptGitHubToken(encrypted: string): string {
  const [version, ivValue, tagValue, ciphertextValue, extra] =
    encrypted.split(".")
  if (version !== "v1") {
    throw new Error("Stored GitHub token has an unsupported format")
  }
  if (!ivValue || !tagValue || !ciphertextValue || extra !== undefined) {
    throw new Error("Stored GitHub token has an unsupported format")
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url")
  )
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}

async function readTokenResponse(response: Response) {
  const parsed = githubTokenResponse.safeParse(await response.json())
  if (!response.ok || !parsed.success || !parsed.data.access_token) {
    throw new Error("GitHub OAuth token request failed")
  }
  return parsed.data
}

export async function exchangeGitHubAuthorizationCode(input: {
  code: string
  codeVerifier: string
  redirectUri: string
}) {
  if (!serverEnv.GITHUB_APP_CLIENT_ID || !serverEnv.GITHUB_APP_CLIENT_SECRET) {
    throw new Error("GitHub App OAuth credentials are not configured")
  }
  const body = new URLSearchParams({
    client_id: serverEnv.GITHUB_APP_CLIENT_ID,
    client_secret: serverEnv.GITHUB_APP_CLIENT_SECRET,
    code: input.code,
    code_verifier: input.codeVerifier,
    redirect_uri: input.redirectUri,
  })
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  })
  return readTokenResponse(response)
}

export async function fetchGitHubUser(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
    cache: "no-store",
  })
  if (!response.ok) throw new Error("GitHub user profile could not be fetched")
  const parsed = githubUserProfile.safeParse(await response.json())
  if (!parsed.success)
    throw new Error("GitHub returned an invalid user profile")
  return parsed.data
}

export async function saveGitHubUserConnection(input: {
  userId: string
  githubUserId: string
  githubLogin: string
  accessToken: string
  refreshToken?: string
  accessTokenExpiresAt?: Date
  refreshTokenExpiresAt?: Date
}) {
  const now = new Date()
  await db
    .insert(githubUserConnection)
    .values({
      id: randomUUID(),
      userId: input.userId,
      githubUserId: input.githubUserId,
      githubLogin: input.githubLogin,
      accessTokenEncrypted: encryptGitHubToken(input.accessToken),
      refreshTokenEncrypted: input.refreshToken
        ? encryptGitHubToken(input.refreshToken)
        : null,
      accessTokenExpiresAt: input.accessTokenExpiresAt ?? null,
      refreshTokenExpiresAt: input.refreshTokenExpiresAt ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: githubUserConnection.userId,
      set: {
        githubUserId: input.githubUserId,
        githubLogin: input.githubLogin,
        accessTokenEncrypted: encryptGitHubToken(input.accessToken),
        refreshTokenEncrypted: input.refreshToken
          ? encryptGitHubToken(input.refreshToken)
          : null,
        accessTokenExpiresAt: input.accessTokenExpiresAt ?? null,
        refreshTokenExpiresAt: input.refreshTokenExpiresAt ?? null,
        updatedAt: now,
      },
    })
}

export async function getGitHubUserAccessToken(
  userId: string
): Promise<string> {
  const [connection] = await db
    .select()
    .from(githubUserConnection)
    .where(eq(githubUserConnection.userId, userId))
    .limit(1)
  if (!connection) throw new Error("GitHub account is not connected")

  const now = Date.now()
  if (
    !connection.accessTokenExpiresAt ||
    connection.accessTokenExpiresAt.getTime() > now + 60_000
  ) {
    return decryptGitHubToken(connection.accessTokenEncrypted)
  }
  const refreshTokenEncrypted = connection.refreshTokenEncrypted
  const existingRefreshExpiresAt = connection.refreshTokenExpiresAt
  const clientId = serverEnv.GITHUB_APP_CLIENT_ID
  const clientSecret = serverEnv.GITHUB_APP_CLIENT_SECRET
  if (
    !refreshTokenEncrypted ||
    !existingRefreshExpiresAt ||
    !clientId ||
    !clientSecret
  ) {
    throw new Error(
      "GitHub authorization expired. Reconnect your GitHub account."
    )
  }
  if (existingRefreshExpiresAt.getTime() <= now) {
    throw new Error(
      "GitHub authorization expired. Reconnect your GitHub account."
    )
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: decryptGitHubToken(refreshTokenEncrypted),
  })
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  })
  const refreshed = await readTokenResponse(response)
  const accessTokenExpiresAt = new Date(
    Date.now() +
      (refreshed.expires_in ?? DEFAULT_ACCESS_TOKEN_TTL_SECONDS) * 1000
  )
  const refreshToken = refreshed.refresh_token
    ? encryptGitHubToken(refreshed.refresh_token)
    : connection.refreshTokenEncrypted
  const refreshTokenExpiresAt = refreshed.refresh_token_expires_in
    ? new Date(Date.now() + refreshed.refresh_token_expires_in * 1000)
    : connection.refreshTokenExpiresAt

  await db
    .update(githubUserConnection)
    .set({
      accessTokenEncrypted: encryptGitHubToken(refreshed.access_token),
      refreshTokenEncrypted: refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(githubUserConnection.id, connection.id),
        eq(githubUserConnection.userId, userId)
      )
    )
  return refreshed.access_token
}
