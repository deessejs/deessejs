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

import { getGitHubUserAccessToken } from "../../core/github-app/user-connection.js"
import {
  GitHubRepositoryRequestError,
  listGitHubInstallationRepositories,
} from "../../core/github-app/repositories.js"
import {
  GitHubProjectConfigRequestError,
  inspectGitHubProjectConfig,
} from "../../core/github-app/project-config.js"
import { base } from "../base.js"
import { authGuard } from "../auth-middleware.js"

const deniedErrors = {
  ORGANIZATION_ACCESS_DENIED: {
    status: 403,
    message: "You cannot access this organization.",
  },
}

const repositoryErrors = {
  ...deniedErrors,
  GITHUB_INSTALLATION_NOT_CONNECTED: {
    status: 409,
    message: "Connect a GitHub App installation to this organization first.",
  },
  GITHUB_ACCOUNT_REQUIRED: {
    status: 409,
    message: "Connect or reconnect your GitHub account to list repositories.",
  },
  GITHUB_INSTALLATION_ACCESS_DENIED: {
    status: 403,
    message: "Your GitHub account cannot access this installation.",
  },
  GITHUB_REPOSITORIES_UNAVAILABLE: {
    status: 502,
    message: "GitHub repositories could not be loaded. Try again.",
  },
  GITHUB_REPOSITORY_NOT_ACCESSIBLE: {
    status: 404,
    message: "This repository is not available through your GitHub installation.",
  },
  GITHUB_REPOSITORY_CONTENTS_FORBIDDEN: {
    status: 403,
    message: "GitHub denied access to this repository. The app needs Contents read-only permission.",
  },
  GITHUB_PROJECT_CONFIG_UNAVAILABLE: {
    status: 502,
    message: "The repository configuration could not be inspected. Try again.",
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

const listRepositories = base
  .input(
    z.object({
      slug: z.string().min(1),
      page: z.number().int().min(1).max(10_000),
    })
  )
  .errors(repositoryErrors)
  .use(authGuard)
  .handler(async ({ context, input, errors }) => {
    const organization = await findOrganizationForMember(
      context.user.id,
      input.slug
    )
    if (!organization || !hasManagingRole(organization.role)) {
      throw errors.ORGANIZATION_ACCESS_DENIED()
    }

    const [installation] = await db
      .select({ installationId: githubAppInstallation.installationId })
      .from(githubAppInstallation)
      .where(eq(githubAppInstallation.organizationId, organization.id))
      .limit(1)
    if (!installation) throw errors.GITHUB_INSTALLATION_NOT_CONNECTED()

    let accessToken: string
    try {
      accessToken = await getGitHubUserAccessToken(context.user.id)
    } catch {
      throw errors.GITHUB_ACCOUNT_REQUIRED()
    }

    try {
      return await listGitHubInstallationRepositories({
        installationId: installation.installationId,
        accessToken,
        page: input.page,
      })
    } catch (error) {
      if (error instanceof GitHubRepositoryRequestError) {
        if (error.status === 401) throw errors.GITHUB_ACCOUNT_REQUIRED()
        if (error.status === 403 || error.status === 404) {
          throw errors.GITHUB_INSTALLATION_ACCESS_DENIED()
        }
      }
      throw errors.GITHUB_REPOSITORIES_UNAVAILABLE()
    }
  })

type GitHubInspectionErrorFactory = () => unknown

async function getRepositoryPageForInspection(
  input: {
    installationId: string
    accessToken: string
    page: number
  },
  errors: {
    accountRequired: GitHubInspectionErrorFactory
    installationAccessDenied: GitHubInspectionErrorFactory
    repositoriesUnavailable: GitHubInspectionErrorFactory
  }
) {
  try {
    return await listGitHubInstallationRepositories(input)
  } catch (error) {
    if (
      error instanceof GitHubRepositoryRequestError &&
      error.status === 401
    ) {
      throw errors.accountRequired()
    }
    if (
      error instanceof GitHubRepositoryRequestError &&
      [403, 404].includes(error.status)
    ) {
      throw errors.installationAccessDenied()
    }
    throw errors.repositoriesUnavailable()
  }
}

async function inspectProjectConfigOrThrow(
  input: {
    fullName: string
    defaultBranch: string
    accessToken: string
  },
  errors: {
    accountRequired: GitHubInspectionErrorFactory
    contentsForbidden: GitHubInspectionErrorFactory
    configurationUnavailable: GitHubInspectionErrorFactory
  }
) {
  try {
    return await inspectGitHubProjectConfig(input)
  } catch (error) {
    if (
      error instanceof GitHubProjectConfigRequestError &&
      error.status === 401
    ) {
      throw errors.accountRequired()
    }
    if (
      error instanceof GitHubProjectConfigRequestError &&
      error.status === 403
    ) {
      throw errors.contentsForbidden()
    }
    throw errors.configurationUnavailable()
  }
}

const inspectConfiguration = base
  .input(
    z.object({
      slug: z.string().min(1),
      repositoryId: z.number().int().positive(),
      page: z.number().int().min(1).max(10_000),
    })
  )
  .errors(repositoryErrors)
  .use(authGuard)
  .handler(async ({ context, input, errors }) => {
    const organization = await findOrganizationForMember(
      context.user.id,
      input.slug
    )
    if (!organization || !hasManagingRole(organization.role)) {
      throw errors.ORGANIZATION_ACCESS_DENIED()
    }

    const [installation] = await db
      .select({ installationId: githubAppInstallation.installationId })
      .from(githubAppInstallation)
      .where(eq(githubAppInstallation.organizationId, organization.id))
      .limit(1)
    if (!installation) throw errors.GITHUB_INSTALLATION_NOT_CONNECTED()

    let accessToken: string
    try {
      accessToken = await getGitHubUserAccessToken(context.user.id)
    } catch {
      throw errors.GITHUB_ACCOUNT_REQUIRED()
    }

    const repositoryPage = await getRepositoryPageForInspection(
      {
        installationId: installation.installationId,
        accessToken,
        page: input.page,
      },
      {
        accountRequired: () => errors.GITHUB_ACCOUNT_REQUIRED(),
        installationAccessDenied: () =>
          errors.GITHUB_INSTALLATION_ACCESS_DENIED(),
        repositoriesUnavailable: () => errors.GITHUB_REPOSITORIES_UNAVAILABLE(),
      }
    )

    const repository = repositoryPage.repositories.find(
      (candidate) => candidate.id === input.repositoryId
    )
    if (!repository) throw errors.GITHUB_REPOSITORY_NOT_ACCESSIBLE()

    if (!repository.defaultBranch) {
      return {
        repository: {
          id: repository.id,
          fullName: repository.fullName,
          defaultBranch: null,
        },
        commitSha: null,
        configuration: { status: "no_default_branch" as const },
      }
    }

    const inspection = await inspectProjectConfigOrThrow(
      {
        fullName: repository.fullName,
        defaultBranch: repository.defaultBranch,
        accessToken,
      },
      {
        accountRequired: () => errors.GITHUB_ACCOUNT_REQUIRED(),
        contentsForbidden: () => errors.GITHUB_REPOSITORY_CONTENTS_FORBIDDEN(),
        configurationUnavailable: () =>
          errors.GITHUB_PROJECT_CONFIG_UNAVAILABLE(),
      }
    )
    return {
      repository: {
        id: repository.id,
        fullName: repository.fullName,
        defaultBranch: repository.defaultBranch,
      },
      ...inspection,
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

export const githubAppRouter = {
  status,
  disconnect,
  repositories: {
    list: listRepositories,
    inspectConfiguration,
  },
}
