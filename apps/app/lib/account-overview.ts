import "server-only"

import { headers } from "next/headers"
import { cache } from "react"
import { z } from "zod"
import { API_AUTH_PATH } from "@workspace/api/base-path"

import { APP_URL } from "@/lib/app-config"

const sessionResponseSchema = z
  .object({
    session: z.object({ id: z.string() }),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.email(),
      emailVerified: z.boolean(),
      image: z.string().nullable().optional(),
    }),
  })
  .nullable()

const organizationListSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    logo: z.string().nullable().optional(),
  })
)

/**
 * Reads the current account and its memberships through Better Auth's
 * session-protected endpoints. The server validates each response and
 * only returns the fields the overview needs.
 */
export const readAccountOverview = cache(async () => {
  const requestHeaders = await headers()
  const cookie = requestHeaders.get("cookie") ?? ""
  const sessionUrl = new URL(`${API_AUTH_PATH}/get-session`, APP_URL)
  const sessionResponse = await fetch(sessionUrl, {
    headers: { cookie },
    cache: "no-store",
  })

  if (!sessionResponse.ok) {
    throw new Error("The account session could not be checked.")
  }

  const session = sessionResponseSchema.parse(await sessionResponse.json())
  if (!session) return null

  const organizationsUrl = new URL(
    `${API_AUTH_PATH}/organization/list`,
    APP_URL
  )
  const organizationsResponse = await fetch(organizationsUrl, {
    headers: { cookie },
    cache: "no-store",
  })

  if (!organizationsResponse.ok) {
    throw new Error("Organization memberships could not be loaded.")
  }

  const organizations = organizationListSchema.parse(
    await organizationsResponse.json()
  )

  return {
    user: session.user,
    organizations,
  }
})
