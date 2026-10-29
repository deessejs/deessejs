import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import {
  db,
  githubAppInstallation,
  githubUserConnection,
  member,
  organization,
} from "@workspace/database"
import { serverEnv } from "@workspace/env/server"
import type { Context, Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"
import { z } from "zod"

import { API_BASE_PATH } from "../../constants/base-path.js"
import {
  createGitHubOAuthState,
  createGitHubPkceChallenge,
  readGitHubOAuthState,
  signGitHubOAuthState,
} from "../../core/github-app/oauth-state.js"
import {
  createGitHubInstallState,
  readGitHubInstallState,
  signGitHubInstallState,
} from "../../core/github-app/install-state.js"
import {
  exchangeGitHubAuthorizationCode,
  fetchGitHubUser,
  getGitHubUserAccessToken,
  saveGitHubUserConnection,
} from "../../core/github-app/user-connection.js"
import type { ApiEnv } from "../env.js"

const GITHUB_API_VERSION = "2022-11-28"
const OAUTH_STATE_COOKIE = "deesse_github_app_oauth"
const INSTALL_STATE_COOKIE = "deesse_github_app_install"
const installationResponseSchema = z.object({
  id: z.number().int().positive(),
  account: z.object({
    id: z.number().int().positive(),
    login: z.string().min(1),
    type: z.string().min(1),
  }),
})
const installationListResponseSchema = z.object({
  total_count: z.number().int().nonnegative(),
  installations: z.array(installationResponseSchema),
})

type Workspace = { id: string; slug: string; role: string }

function settingsUrl(slug?: string, result = "error"): string {
  const path = slug
    ? `/${encodeURIComponent(slug)}/settings/organization`
    : "/home"
  const url = new URL(path, serverEnv.APP_URL)
  url.searchParams.set("githubApp", result)
  return url.toString()
}

function callbackUrl(): string {
  return new URL(
    `${API_BASE_PATH}/github-app/oauth/callback`,
    serverEnv.APP_URL
  ).toString()
}

function isGitHubAppConfigured(): boolean {
  return Boolean(
    serverEnv.GITHUB_APP_CLIENT_ID &&
    serverEnv.GITHUB_APP_CLIENT_SECRET &&
    serverEnv.GITHUB_APP_SLUG &&
    serverEnv.GITHUB_APP_TOKEN_ENCRYPTION_KEY
  )
}

async function findWorkspaceBySlug(
  userId: string,
  slug: string
): Promise<Workspace | null> {
  const [workspace] = await db
    .select({ id: organization.id, slug: organization.slug, role: member.role })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(and(eq(member.userId, userId), eq(organization.slug, slug)))
    .limit(1)
  return workspace ?? null
}

async function findWorkspaceById(
  userId: string,
  organizationId: string
): Promise<Workspace | null> {
  const [workspace] = await db
    .select({ id: organization.id, slug: organization.slug, role: member.role })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(and(eq(member.userId, userId), eq(organization.id, organizationId)))
    .limit(1)
  return workspace ?? null
}

function isManager(workspace: Workspace | null): workspace is Workspace {
  return Boolean(workspace && hasManagingRole(workspace.role))
}

async function startOAuth(c: Context<ApiEnv>): Promise<Response> {
  const user = c.get("user")
  if (!user) return c.redirect(new URL("/login", serverEnv.APP_URL).toString())
  const slug = c.req.query("slug")
  if (!slug) return c.redirect(settingsUrl())
  const clientId = serverEnv.GITHUB_APP_CLIENT_ID
  if (
    !clientId ||
    !serverEnv.GITHUB_APP_CLIENT_SECRET ||
    !serverEnv.GITHUB_APP_SLUG ||
    !serverEnv.GITHUB_APP_TOKEN_ENCRYPTION_KEY
  ) {
    return c.redirect(settingsUrl(slug, "notConfigured"))
  }

  const workspace = await findWorkspaceBySlug(user.id, slug)
  if (!isManager(workspace)) return c.redirect(settingsUrl())

  const state = createGitHubOAuthState({
    organizationId: workspace.id,
    userId: user.id,
  })
  setCookie(c, OAUTH_STATE_COOKIE, signGitHubOAuthState(state), {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === "production",
    sameSite: "Lax",
    path: `${API_BASE_PATH}/github-app/oauth/callback`,
    maxAge: 10 * 60,
  })

  const authorizationUrl = new URL("https://github.com/login/oauth/authorize")
  authorizationUrl.searchParams.set("client_id", clientId)
  authorizationUrl.searchParams.set("redirect_uri", callbackUrl())
  authorizationUrl.searchParams.set("state", state.state)
  authorizationUrl.searchParams.set("scope", "offline_access")
  authorizationUrl.searchParams.set(
    "code_challenge",
    createGitHubPkceChallenge(state.codeVerifier)
  )
  authorizationUrl.searchParams.set("code_challenge_method", "S256")
  return c.redirect(authorizationUrl.toString())
}

async function finishOAuthConnection(
  c: Context<ApiEnv>,
  state: NonNullable<ReturnType<typeof readGitHubOAuthState>>,
  workspace: Workspace,
  code: string
): Promise<Response> {
  try {
    const tokens = await exchangeGitHubAuthorizationCode({
      code,
      codeVerifier: state.codeVerifier,
      redirectUri: callbackUrl(),
    })
    const profile = await fetchGitHubUser(tokens.access_token)
    const now = Date.now()
    await saveGitHubUserConnection({
      userId: state.userId,
      githubUserId: String(profile.id),
      githubLogin: profile.login,
      accessToken: tokens.access_token,
      ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      ...(tokens.expires_in
        ? { accessTokenExpiresAt: new Date(now + tokens.expires_in * 1000) }
        : {}),
      ...(tokens.refresh_token_expires_in
        ? {
            refreshTokenExpiresAt: new Date(
              now + tokens.refresh_token_expires_in * 1000
            ),
          }
        : {}),
    })
    return c.redirect(settingsUrl(workspace.slug, "accountConnected"))
  } catch {
    return c.redirect(settingsUrl(workspace.slug, "oauthError"))
  }
}

async function finishOAuthCallback(c: Context<ApiEnv>): Promise<Response> {
  const stateCookie = getCookie(c, OAUTH_STATE_COOKIE)
  deleteCookie(c, OAUTH_STATE_COOKIE, {
    path: `${API_BASE_PATH}/github-app/oauth/callback`,
    secure: serverEnv.NODE_ENV === "production",
    sameSite: "Lax",
  })
  const state = stateCookie ? readGitHubOAuthState(stateCookie) : null
  if (!state || c.req.query("state") !== state.state) {
    return c.redirect(settingsUrl())
  }

  const workspace = await findWorkspaceById(state.userId, state.organizationId)
  if (!isManager(workspace)) return c.redirect(settingsUrl())
  if (c.get("user")?.id !== state.userId) {
    return c.redirect(settingsUrl(workspace.slug, "reauthenticate"))
  }
  if (c.req.query("error")) {
    return c.redirect(settingsUrl(workspace.slug, "oauthDenied"))
  }
  const code = c.req.query("code")
  if (!code || !isGitHubAppConfigured()) {
    return c.redirect(settingsUrl(workspace.slug, "oauthError"))
  }
  return finishOAuthConnection(c, state, workspace, code)
}

async function startInstallation(c: Context<ApiEnv>): Promise<Response> {
  const user = c.get("user")
  if (!user) return c.redirect(new URL("/login", serverEnv.APP_URL).toString())
  const slug = c.req.query("slug")
  if (!slug) return c.redirect(settingsUrl())
  if (!isGitHubAppConfigured()) {
    return c.redirect(settingsUrl(slug, "notConfigured"))
  }

  const workspace = await findWorkspaceBySlug(user.id, slug)
  if (!isManager(workspace)) return c.redirect(settingsUrl())
  const [connection] = await db
    .select({ id: githubUserConnection.id })
    .from(githubUserConnection)
    .where(eq(githubUserConnection.userId, user.id))
    .limit(1)
  if (!connection) {
    return c.redirect(settingsUrl(workspace.slug, "githubAccountRequired"))
  }

  const state = createGitHubInstallState({
    organizationId: workspace.id,
    userId: user.id,
  })
  setCookie(c, INSTALL_STATE_COOKIE, signGitHubInstallState(state), {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === "production",
    sameSite: "Lax",
    path: `${API_BASE_PATH}/github-app/setup`,
    maxAge: 10 * 60,
  })
  const installationUrl = new URL(
    `https://github.com/apps/${serverEnv.GITHUB_APP_SLUG}/installations/new`
  )
  installationUrl.searchParams.set("state", state.state)
  return c.redirect(installationUrl.toString())
}

async function finishInstallationCallback(
  c: Context<ApiEnv>
): Promise<Response> {
  const stateCookie = getCookie(c, INSTALL_STATE_COOKIE)
  deleteCookie(c, INSTALL_STATE_COOKIE, {
    path: `${API_BASE_PATH}/github-app/setup`,
    secure: serverEnv.NODE_ENV === "production",
    sameSite: "Lax",
  })
  const state = stateCookie ? readGitHubInstallState(stateCookie) : null
  if (!state || c.req.query("state") !== state.state) {
    return c.redirect(settingsUrl())
  }

  const workspace = await findWorkspaceById(state.userId, state.organizationId)
  if (!isManager(workspace)) return c.redirect(settingsUrl())
  const done = (result: string) =>
    c.redirect(settingsUrl(workspace.slug, result))
  if (c.get("user")?.id !== state.userId) return done("reauthenticate")
  if (c.req.query("setup_action") === "cancel") return done("cancelled")
  if (c.req.query("setup_action") !== "install") return done("error")

  const installationId = c.req.query("installation_id")
  if (!installationId || !/^\d{1,20}$/.test(installationId)) return done("error")

  let accessToken: string
  try {
    accessToken = await getGitHubUserAccessToken(state.userId)
  } catch {
    return done("githubAccountRequired")
  }
  let installation: Awaited<ReturnType<typeof fetchGitHubInstallation>>
  try {
    installation = await fetchGitHubInstallation(installationId, accessToken)
  } catch {
    return done("installationCheckFailed")
  }
  if (!installation) return done("installationNotAccessible")

  const now = new Date()
  await db
    .insert(githubAppInstallation)
    .values({
      id: randomUUID(),
      organizationId: workspace.id,
      installationId,
      accountId: String(installation.account.id),
      accountLogin: installation.account.login,
      accountType: installation.account.type,
      linkedByUserId: state.userId,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: githubAppInstallation.organizationId,
      set: {
        installationId,
        accountId: String(installation.account.id),
        accountLogin: installation.account.login,
        accountType: installation.account.type,
        linkedByUserId: state.userId,
        updatedAt: now,
      },
    })
  return done("connected")
}

async function fetchGitHubInstallation(
  installationId: string,
  token: string
): Promise<z.infer<typeof installationResponseSchema> | null> {
  const url = new URL("https://api.github.com/user/installations")
  url.searchParams.set("per_page", "100")
  let page = 1
  let totalPages = 1

  do {
    url.searchParams.set("page", String(page))
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
      cache: "no-store",
    })
    if (!response.ok) {
      throw new Error(`GitHub installations request failed: ${response.status}`)
    }

    const parsed = installationListResponseSchema.parse(await response.json())
    totalPages = Math.ceil(parsed.total_count / 100)
    const installation = parsed.installations.find(
      (item) => String(item.id) === installationId
    )
    if (installation) return installation
    page += 1
  } while (page <= totalPages)

  return null
}

export const mountGitHubAppSetup = (api: Hono<ApiEnv>): void => {
  api.get("/github-app/oauth/start", (c) => startOAuth(c))
  api.get("/github-app/oauth/callback", (c) => finishOAuthCallback(c))
  api.get("/github-app/install/start", (c) => startInstallation(c))
  api.get("/github-app/setup", (c) => finishInstallationCallback(c))
}
