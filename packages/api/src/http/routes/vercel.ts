import { createHash, randomUUID } from "node:crypto"
import { and, eq, gt, lt } from "drizzle-orm"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import {
  db,
  member,
  organization,
  vercelOrganizationConnection,
  vercelOAuthState,
  vercelProjectMapping,
} from "@workspace/database"
import { serverEnv } from "@workspace/env/server"
import type { Context, Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"

import { API_BASE_PATH } from "../../constants/base-path.js"
import {
  createIntegrationOAuthState,
  readIntegrationOAuthState,
  signIntegrationOAuthState,
} from "../../core/integrations/oauth-state.js"
import {
  exchangeVercelAuthorizationCode,
  identifyVercelAccount,
  requestVercelInstallationToken,
} from "../../core/integrations/vercel.js"
import type { ApiEnv } from "../env.js"

const stateCookie = "deesse_vercel_oauth"
const callbackPath = `${API_BASE_PATH}/vercel/oauth/callback`

async function findOrganization(userId: string, slug: string) {
  const [result] = await db
    .select({ id: organization.id, slug: organization.slug, role: member.role })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(and(eq(member.userId, userId), eq(organization.slug, slug)))
    .limit(1)
  return result ?? null
}

function settingsUrl(slug?: string, result = "error") {
  const path = slug
    ? `/${encodeURIComponent(slug)}/settings/organization`
    : "/home"
  const url = new URL(path, serverEnv.APP_URL)
  url.searchParams.set("vercelIntegration", result)
  return url.toString()
}

function configured() {
  return Boolean(
    serverEnv.VERCEL_CLIENT_ID &&
    serverEnv.VERCEL_CLIENT_SECRET &&
    serverEnv.VERCEL_INTEGRATION_SLUG
  )
}

function credentials() {
  const clientId = serverEnv.VERCEL_CLIENT_ID
  const clientSecret = serverEnv.VERCEL_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error("Vercel is not configured")
  return { clientId, clientSecret }
}

async function startOAuth(c: Context<ApiEnv>) {
  const user = c.get("user")
  const slug = c.req.query("slug")
  if (!user || !slug) return c.redirect(settingsUrl())
  if (!configured()) return c.redirect(settingsUrl(slug, "notConfigured"))
  const integrationSlug = serverEnv.VERCEL_INTEGRATION_SLUG
  if (!integrationSlug) return c.redirect(settingsUrl(slug, "notConfigured"))

  const workspace = await findOrganization(user.id, slug)
  if (!workspace || !hasManagingRole(workspace.role)) {
    return c.redirect(settingsUrl())
  }

  const state = createIntegrationOAuthState({
    organizationId: workspace.id,
    userId: user.id,
  })
  const signedState = signIntegrationOAuthState(state)
  await db
    .delete(vercelOAuthState)
    .where(lt(vercelOAuthState.expiresAt, new Date()))
  await db.insert(vercelOAuthState).values({
    stateHash: createHash("sha256").update(state.state).digest("hex"),
    organizationId: workspace.id,
    userId: user.id,
    expiresAt: new Date(state.expiresAt * 1000),
  })
  setCookie(c, stateCookie, signedState, {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === "production",
    sameSite: "Lax",
    path: callbackPath,
    maxAge: 10 * 60,
  })

  const url = new URL(
    `https://vercel.com/integrations/${encodeURIComponent(integrationSlug)}/new`
  )
  url.searchParams.set("state", state.state)
  return c.redirect(url.toString())
}

async function finishOAuth(c: Context<ApiEnv>) {
  const cookie = getCookie(c, stateCookie)
  deleteCookie(c, stateCookie, {
    path: callbackPath,
    secure: serverEnv.NODE_ENV === "production",
    sameSite: "Lax",
  })
  const state = cookie ? readIntegrationOAuthState(cookie) : null
  if (!state || c.req.query("state") !== state.state) {
    return c.redirect(settingsUrl())
  }
  const [consumedState] = await db
    .delete(vercelOAuthState)
    .where(
      and(
        eq(
          vercelOAuthState.stateHash,
          createHash("sha256").update(state.state).digest("hex")
        ),
        eq(vercelOAuthState.userId, state.userId),
        eq(vercelOAuthState.organizationId, state.organizationId),
        gt(vercelOAuthState.expiresAt, new Date())
      )
    )
    .returning({ stateHash: vercelOAuthState.stateHash })
  if (!consumedState) return c.redirect(settingsUrl())
  const [workspace] = await db
    .select({ id: organization.id, slug: organization.slug, role: member.role })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(
      and(
        eq(member.userId, state.userId),
        eq(organization.id, state.organizationId)
      )
    )
    .limit(1)
  if (!workspace || !hasManagingRole(workspace.role)) {
    return c.redirect(settingsUrl())
  }
  const done = (result: string) =>
    c.redirect(settingsUrl(workspace.slug, result))
  if (c.get("user")?.id !== state.userId) return done("reauthenticate")
  if (c.req.query("error")) return done("cancelled")
  const code = c.req.query("code")
  if (!code || !configured()) return done("error")

  try {
    const tokens = credentials()
    const exchange = await exchangeVercelAuthorizationCode({
      code,
      redirectUri: new URL(callbackPath, serverEnv.APP_URL).toString(),
      credentials: tokens,
    })
    const accessToken = await requestVercelInstallationToken(
      exchange.installation_id,
      tokens
    )
    const account = await identifyVercelAccount({
      accessToken,
      teamId: exchange.team_id ?? null,
      userId: exchange.user_id,
    })
    const now = new Date()
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ accountId: vercelOrganizationConnection.accountId })
        .from(vercelOrganizationConnection)
        .where(eq(vercelOrganizationConnection.organizationId, workspace.id))
        .limit(1)
      if (existing && existing.accountId !== account.accountId) {
        await tx
          .delete(vercelProjectMapping)
          .where(eq(vercelProjectMapping.organizationId, workspace.id))
      }
      await tx
        .insert(vercelOrganizationConnection)
        .values({
          id: randomUUID(),
          organizationId: workspace.id,
          configurationId: exchange.installation_id,
          teamId: exchange.team_id ?? null,
          accountId: account.accountId,
          accountName: account.accountName,
          linkedByUserId: state.userId,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: vercelOrganizationConnection.organizationId,
          set: {
            configurationId: exchange.installation_id,
            teamId: exchange.team_id ?? null,
            accountId: account.accountId,
            accountName: account.accountName,
            linkedByUserId: state.userId,
            updatedAt: now,
          },
        })
    })
    return done("connected")
  } catch {
    return done("error")
  }
}

export function mountVercelRoutes(api: Hono<ApiEnv>) {
  api.get("/vercel/oauth/start", (c) => startOAuth(c))
  api.get("/vercel/oauth/callback", (c) => finishOAuth(c))
}
