import { randomUUID } from "node:crypto"
import { and, asc, desc, eq, inArray } from "drizzle-orm"
import { z } from "zod"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import {
  db,
  githubAppInstallation,
  githubProject,
  githubProjectCheck,
  githubUserConnection,
} from "@workspace/database"
import { member, organization } from "@workspace/database/schema"
import { serverEnv } from "@workspace/env/server"

import {
  getGitHubUserAccessToken,
  GitHubUserAccessTokenError,
} from "../../core/github-app/user-connection.js"
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
import { logger } from "../../constants/logger.js"

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
  GITHUB_ACCOUNT_UNAVAILABLE: {
    status: 502,
    message: "Your GitHub connection could not be checked. Try again.",
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
    message:
      "This repository is not available through your GitHub installation.",
  },
  GITHUB_REPOSITORY_CONTENTS_FORBIDDEN: {
    status: 403,
    message:
      "GitHub denied access to this repository. The app needs Contents read-only permission.",
  },
  GITHUB_PROJECT_CONFIG_UNAVAILABLE: {
    status: 502,
    message: "The repository configuration could not be inspected. Try again.",
  },
  GITHUB_PROJECT_CONFIG_CHANGED: {
    status: 409,
    message:
      "The default branch changed. Review the configuration again before importing.",
  },
  GITHUB_PROJECT_CONFIG_NOT_VALID: {
    status: 409,
    message:
      "The repository configuration is not valid and cannot be imported.",
  },
  GITHUB_PROJECT_NO_DEFAULT_BRANCH: {
    status: 409,
    message: "This repository does not have a default branch to import.",
  },
}

type AccessTokenErrorFactories = {
  accountRequired: () => unknown
  accountUnavailable: () => unknown
}

async function getAccessTokenOrThrow(
  userId: string,
  requestId: string,
  errors: AccessTokenErrorFactories
): Promise<string> {
  try {
    return await getGitHubUserAccessToken(userId)
  } catch (error) {
    if (
      error instanceof GitHubUserAccessTokenError &&
      error.code === "ACCOUNT_REQUIRED"
    ) {
      throw errors.accountRequired()
    }

    const failureCategory =
      error instanceof GitHubUserAccessTokenError
        ? error.code
        : "DATABASE_LOOKUP_FAILED"
    logger.error(
      "github_user_access_token_failed",
      new Error("GitHub user access token resolution failed"),
      { requestId, userId, failureCategory }
    )
    throw errors.accountUnavailable()
  }
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

    const accessToken = await getAccessTokenOrThrow(
      context.user.id,
      context.requestId,
      {
        accountRequired: () => errors.GITHUB_ACCOUNT_REQUIRED(),
        accountUnavailable: () => errors.GITHUB_ACCOUNT_UNAVAILABLE(),
      }
    )

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
    if (error instanceof GitHubRepositoryRequestError && error.status === 401) {
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

    const accessToken = await getAccessTokenOrThrow(
      context.user.id,
      context.requestId,
      {
        accountRequired: () => errors.GITHUB_ACCOUNT_REQUIRED(),
        accountUnavailable: () => errors.GITHUB_ACCOUNT_UNAVAILABLE(),
      }
    )

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

const listProjects = base
  .input(z.object({ slug: z.string().min(1) }))
  .errors(deniedErrors)
  .use(authGuard)
  .handler(async ({ context, input, errors }) => {
    const organization = await findOrganizationForMember(
      context.user.id,
      input.slug
    )
    if (!organization) throw errors.ORGANIZATION_ACCESS_DENIED()

    const projects = await db
      .select({
        id: githubProject.id,
        repositoryId: githubProject.repositoryId,
        repositoryFullName: githubProject.repositoryFullName,
        repositoryUrl: githubProject.repositoryUrl,
        isPrivate: githubProject.isPrivate,
        defaultBranch: githubProject.defaultBranch,
        configurationPath: githubProject.configurationPath,
      })
      .from(githubProject)
      .where(eq(githubProject.organizationId, organization.id))
      .orderBy(asc(githubProject.repositoryFullName))

    if (projects.length === 0) return { projects: [] }

    const checks = await db
      .select({
        projectId: githubProjectCheck.projectId,
        status: githubProjectCheck.status,
        checkedAt: githubProjectCheck.checkedAt,
      })
      .from(githubProjectCheck)
      .where(
        inArray(
          githubProjectCheck.projectId,
          projects.map((project) => project.id)
        )
      )
      .orderBy(desc(githubProjectCheck.checkedAt))

    const latestChecks = new Map<string, (typeof checks)[number]>()
    for (const check of checks) {
      if (!latestChecks.has(check.projectId)) {
        latestChecks.set(check.projectId, check)
      }
    }

    return {
      projects: projects.map((project) => {
        const check = latestChecks.get(project.id)
        return {
          id: project.id,
          name:
            project.repositoryFullName.split("/").at(-1) ??
            project.repositoryFullName,
          repositoryId: project.repositoryId,
          repositoryFullName: project.repositoryFullName,
          repositoryUrl: project.repositoryUrl,
          isPrivate: project.isPrivate,
          defaultBranch: project.defaultBranch,
          configurationPath: project.configurationPath,
          status: check?.status ?? ("needs_revalidation" as const),
          lastCheckedAt: check?.checkedAt.toISOString() ?? null,
        }
      }),
    }
  })

const getProject = base
  .input(
    z.object({ slug: z.string().min(1), projectId: z.string().uuid() })
  )
  .errors({
    ...deniedErrors,
    PROJECT_NOT_FOUND: {
      status: 404,
      message: "This project was not found in this organization.",
    },
  })
  .use(authGuard)
  .handler(async ({ context, input, errors }) => {
    const organization = await findOrganizationForMember(
      context.user.id,
      input.slug
    )
    if (!organization) throw errors.ORGANIZATION_ACCESS_DENIED()

    const [project] = await db
      .select({
        id: githubProject.id,
        repositoryFullName: githubProject.repositoryFullName,
        repositoryUrl: githubProject.repositoryUrl,
        isPrivate: githubProject.isPrivate,
        defaultBranch: githubProject.defaultBranch,
        configurationPath: githubProject.configurationPath,
      })
      .from(githubProject)
      .where(
        and(
          eq(githubProject.id, input.projectId),
          eq(githubProject.organizationId, organization.id)
        )
      )
      .limit(1)

    if (!project) throw errors.PROJECT_NOT_FOUND()

    const [check] = await db
      .select({
        status: githubProjectCheck.status,
        commitSha: githubProjectCheck.commitSha,
        formatVersion: githubProjectCheck.formatVersion,
        pathCount: githubProjectCheck.pathCount,
        aliasCount: githubProjectCheck.aliasCount,
        checkedAt: githubProjectCheck.checkedAt,
      })
      .from(githubProjectCheck)
      .where(eq(githubProjectCheck.projectId, project.id))
      .orderBy(desc(githubProjectCheck.checkedAt))
      .limit(1)

    return {
      project: {
        ...project,
        name:
          project.repositoryFullName.split("/").at(-1) ??
          project.repositoryFullName,
        status: check?.status ?? ("needs_revalidation" as const),
        lastCheckedAt: check?.checkedAt.toISOString() ?? null,
        commitSha: check?.commitSha ?? null,
        formatVersion: check?.formatVersion ?? null,
        pathCount: check?.pathCount ?? null,
        aliasCount: check?.aliasCount ?? null,
      },
    }
  })

const importProject = base
  .input(
    z.object({
      slug: z.string().min(1),
      repositoryId: z.number().int().positive(),
      page: z.number().int().min(1).max(10_000),
      expectedCommitSha: z.string().regex(/^[a-f0-9]{40,64}$/i),
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

    const accessToken = await getAccessTokenOrThrow(
      context.user.id,
      context.requestId,
      {
        accountRequired: () => errors.GITHUB_ACCOUNT_REQUIRED(),
        accountUnavailable: () => errors.GITHUB_ACCOUNT_UNAVAILABLE(),
      }
    )

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
    const defaultBranch = repository.defaultBranch
    if (!defaultBranch) {
      throw errors.GITHUB_PROJECT_NO_DEFAULT_BRANCH()
    }

    const inspection = await inspectProjectConfigOrThrow(
      {
        fullName: repository.fullName,
        defaultBranch,
        accessToken,
      },
      {
        accountRequired: () => errors.GITHUB_ACCOUNT_REQUIRED(),
        contentsForbidden: () => errors.GITHUB_REPOSITORY_CONTENTS_FORBIDDEN(),
        configurationUnavailable: () =>
          errors.GITHUB_PROJECT_CONFIG_UNAVAILABLE(),
      }
    )

    if (inspection.commitSha !== input.expectedCommitSha) {
      throw errors.GITHUB_PROJECT_CONFIG_CHANGED()
    }
    const configuration = inspection.configuration
    if (configuration.status !== "valid") {
      throw errors.GITHUB_PROJECT_CONFIG_NOT_VALID()
    }

    const projectId = randomUUID()
    const checkedAt = new Date()
    const result = await db.transaction(async (tx) => {
      const [createdProject] = await tx
        .insert(githubProject)
        .values({
          id: projectId,
          organizationId: organization.id,
          repositoryId: String(repository.id),
          repositoryFullName: repository.fullName,
          repositoryUrl: repository.htmlUrl,
          isPrivate: repository.isPrivate,
          defaultBranch,
          configurationPath: "deesse.json",
          importedByUserId: context.user.id,
          importedAt: checkedAt,
        })
        .onConflictDoNothing()
        .returning({ id: githubProject.id })

      if (!createdProject) {
        const [existingProject] = await tx
          .select({ id: githubProject.id })
          .from(githubProject)
          .where(
            and(
              eq(githubProject.organizationId, organization.id),
              eq(githubProject.repositoryId, String(repository.id)),
              eq(githubProject.configurationPath, "deesse.json")
            )
          )
          .limit(1)
        return {
          projectId: existingProject?.id ?? projectId,
          alreadyImported: true,
        }
      }

      await tx.insert(githubProjectCheck).values({
        id: randomUUID(),
        projectId,
        status: "valid",
        commitSha: inspection.commitSha,
        formatVersion: configuration.formatVersion,
        pathCount: configuration.pathCount,
        aliasCount: configuration.aliasCount,
        checkedAt,
      })

      return { projectId, alreadyImported: false }
    })

    return result
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
    import: importProject,
  },
  projects: {
    list: listProjects,
    get: getProject,
  },
}
