import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import {
  db,
  githubAppInstallation,
  githubUserConnection,
} from "@workspace/database"
import { member, organization } from "@workspace/database/schema"
import { serverEnv } from "@workspace/env/server"

import { base } from "../base.js"
import { authGuard } from "../auth-middleware.js"

const deniedErrors = {
  ORGANIZATION_ACCESS_DENIED: {
    status: 403,
    message: "You cannot access this organization.",
  },
}

async function findOrganizationForMember(userId: string, slug: string) {
  const rows = await db
    .select({
      id: organization.id,
      slug: organization.slug,
      role: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(and(eq(member.userId, userId), eq(organization.slug, slug)))
    .limit(1)
  return rows[0] ?? null
}

function hasUsableGitHubConnection(
  connection:
    | {
        accessTokenExpiresAt: Date | null
        refreshTokenExpiresAt: Date | null
      }
    | undefined
): boolean {
  if (!connection || !connection.accessTokenExpiresAt)
    return Boolean(connection)
  const now = Date.now()
  if (connection.accessTokenExpiresAt.getTime() > now + 60_000) return true
  return Boolean(
    connection.refreshTokenExpiresAt &&
    connection.refreshTokenExpiresAt.getTime() > now
  )
}

export const status = base
  .input(z.object({ slug: z.string() }))
  .errors(deniedErrors)
  .use(authGuard)
  .handler(async ({ context, input, errors }) => {
    const organization = await findOrganizationForMember(
      context.user.id,
      input.slug
    )
    if (!organization) throw errors.ORGANIZATION_ACCESS_DENIED()

    const [installations, linkedAccounts] = await Promise.all([
      db
        .select({
          accountLogin: githubAppInstallation.accountLogin,
          accountType: githubAppInstallation.accountType,
          createdAt: githubAppInstallation.createdAt,
        })
        .from(githubAppInstallation)
        .where(eq(githubAppInstallation.organizationId, organization.id))
        .limit(1),
      db
        .select({
          accessTokenExpiresAt: githubUserConnection.accessTokenExpiresAt,
          refreshTokenExpiresAt: githubUserConnection.refreshTokenExpiresAt,
        })
        .from(githubUserConnection)
        .where(eq(githubUserConnection.userId, context.user.id))
        .limit(1),
    ])
    const installation = installations[0]
    const linkedAccount = linkedAccounts[0]

    return {
      installation: installation
        ? {
            accountLogin: installation.accountLogin,
            accountType: installation.accountType,
            connectedAt: installation.createdAt.toISOString(),
          }
        : null,
      githubAccountLinked: hasUsableGitHubConnection(linkedAccount),
      canManage: hasManagingRole(organization.role),
      appConfigured: Boolean(
        serverEnv.GITHUB_APP_CLIENT_ID &&
        serverEnv.GITHUB_APP_CLIENT_SECRET &&
        serverEnv.GITHUB_APP_SLUG &&
        serverEnv.GITHUB_APP_TOKEN_ENCRYPTION_KEY
      ),
    }
  })

export const disconnect = base
  .input(z.object({ slug: z.string() }))
  .errors(deniedErrors)
  .use(authGuard)
  .handler(async ({ context, input, errors }) => {
    const organization = await findOrganizationForMember(
      context.user.id,
      input.slug
    )
    if (!organization || !hasManagingRole(organization.role)) {
      throw errors.ORGANIZATION_ACCESS_DENIED()
    }

    await db
      .delete(githubAppInstallation)
      .where(eq(githubAppInstallation.organizationId, organization.id))
    return { success: true as const }
  })

export const githubAppRouter = { status, disconnect }
