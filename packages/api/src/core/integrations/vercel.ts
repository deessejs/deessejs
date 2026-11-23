import { z } from "zod"

import type { ExternalConnector, ExternalProject } from "./connector.js"

const tokenSchema = z.object({ access_token: z.string().min(1) })
const projectListSchema = z.object({
  projects: z.array(
    z.object({ id: z.string().min(1), name: z.string().min(1) })
  ),
  pagination: z
    .object({ next: z.number().int().positive().nullable().optional() })
    .optional(),
})

type VercelCredentials = { clientId: string; clientSecret: string }

export class VercelAuthorizationError extends Error {}
export class VercelRequestError extends Error {}

export async function requestVercelInstallationToken(
  configurationId: string,
  credentials: VercelCredentials
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    installation_id: configurationId,
  })
  const authorization = Buffer.from(
    `${credentials.clientId}:${credentials.clientSecret}`
  ).toString("base64")
  const response = await fetch("https://api.vercel.com/v2/oauth/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  })
  if (!response.ok) {
    if ([400, 401, 403].includes(response.status)) {
      throw new VercelAuthorizationError("Vercel installation is unavailable")
    }
    throw new VercelRequestError("Vercel token request failed")
  }
  const parsed = tokenSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new VercelRequestError("Vercel token response was invalid")
  }
  return parsed.data.access_token
}

export async function exchangeVercelAuthorizationCode(input: {
  code: string
  redirectUri: string
  credentials: VercelCredentials
}) {
  const response = await fetch("https://api.vercel.com/v2/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: input.credentials.clientId,
      client_secret: input.credentials.clientSecret,
      code: input.code,
      redirect_uri: input.redirectUri,
    }),
    cache: "no-store",
  })
  const parsed = z
    .object({
      access_token: z.string().min(1),
      installation_id: z.string().startsWith("icfg_"),
      team_id: z.string().min(1).nullable().optional(),
      user_id: z.string().min(1),
    })
    .safeParse(await response.json())
  if (!response.ok || !parsed.success) {
    throw new Error("Vercel authorization could not be exchanged")
  }
  return parsed.data
}

async function fetchAccountName(
  accessToken: string,
  teamId: string | null,
  userId: string
): Promise<string> {
  const endpoint = teamId
    ? `https://api.vercel.com/v2/teams/${encodeURIComponent(teamId)}`
    : "https://api.vercel.com/v2/user"
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new VercelAuthorizationError("Vercel account is unavailable")
    }
    throw new VercelRequestError("Vercel account could not be verified")
  }
  const raw: unknown = await response.json()
  const parsed = z
    .object({
      name: z.string().optional(),
      username: z.string().optional(),
      slug: z.string().optional(),
    })
    .safeParse(raw)
  if (!parsed.success) {
    throw new VercelRequestError("Vercel returned an invalid account")
  }
  return parsed.data.name ?? parsed.data.slug ?? parsed.data.username ?? userId
}

export async function identifyVercelAccount(input: {
  accessToken: string
  teamId: string | null
  userId: string
}) {
  return {
    accountId: input.teamId ?? input.userId,
    accountName: await fetchAccountName(
      input.accessToken,
      input.teamId,
      input.userId
    ),
  }
}

export function createVercelConnector(
  credentials: VercelCredentials
): ExternalConnector {
  return {
    provider: "vercel",
    async listProjects(connection): Promise<ExternalProject[]> {
      const accessToken = await requestVercelInstallationToken(
        connection.configurationId,
        credentials
      )
      const projects: ExternalProject[] = []
      let until: number | null = null

      do {
        const url = new URL("https://api.vercel.com/v9/projects")
        url.searchParams.set("limit", "100")
        if (connection.teamId) url.searchParams.set("teamId", connection.teamId)
        if (until) url.searchParams.set("until", String(until))

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        })
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new VercelAuthorizationError(
              "Vercel access was revoked or disabled"
            )
          }
          throw new VercelRequestError("Vercel projects could not be loaded")
        }
        const parsed = projectListSchema.safeParse(await response.json())
        if (!parsed.success) {
          throw new VercelRequestError("Vercel returned invalid projects")
        }
        projects.push(...parsed.data.projects)
        until = parsed.data.pagination?.next ?? null
      } while (until)

      return projects
    },
  }
}
