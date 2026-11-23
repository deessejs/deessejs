import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import {
  db,
  githubProject,
  member,
  organization,
  vercelOrganizationConnection,
  vercelProjectMapping,
} from "@workspace/database"
import { serverEnv } from "@workspace/env/server"

import {
  createVercelConnector,
  VercelAuthorizationError,
} from "../../core/integrations/vercel.js"
import { base } from "../base.js"
import { authGuard } from "../auth-middleware.js"

const errors = {
  ORGANIZATION_ACCESS_DENIED: {
    status: 403,
    message: "You cannot manage this organization.",
  },
  VERCEL_NOT_CONFIGURED: {
    status: 409,
    message: "Vercel integration is not configured.",
  },
  VERCEL_NOT_CONNECTED: {
    status: 409,
    message: "Connect a Vercel account to this organization first.",
  },
  VERCEL_ACCESS_UNAVAILABLE: {
    status: 409,
    message:
      "Vercel access is unavailable. Reconnect the account and try again.",
  },
  VERCEL_PROJECTS_UNAVAILABLE: {
    status: 502,
    message: "Vercel projects could not be loaded. Try again shortly.",
  },
  PROJECT_NOT_FOUND: {
    status: 404,
    message: "This DeesseJS project does not exist in this organization.",
  },
  VERCEL_PROJECT_NOT_ACCESSIBLE: {
    status: 404,
    message: "This Vercel project is not accessible through the connection.",
  },
  VERCEL_PROJECT_ALREADY_MAPPED: {
    status: 409,
    message:
      "This Vercel project is already linked to another DeesseJS project.",
  },
}

async function findOrganizationForMember(userId: string, slug: string) {
  const [result] = await db
    .select({ id: organization.id, slug: organization.slug, role: member.role })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(and(eq(member.userId, userId), eq(organization.slug, slug)))
    .limit(1)
  return result ?? null
}

function connector() {
  if (!serverEnv.VERCEL_CLIENT_ID || !serverEnv.VERCEL_CLIENT_SECRET)
    return null
  return createVercelConnector({
    clientId: serverEnv.VERCEL_CLIENT_ID,
    clientSecret: serverEnv.VERCEL_CLIENT_SECRET,
  })
}

async function listProjectsFromVercel(
  connection: { configurationId: string; teamId: string | null },
  errors: {
    notConfigured: () => unknown
    accessUnavailable: () => unknown
    projectsUnavailable: () => unknown
  }
) {
  const vercel = connector()
  if (!vercel) throw errors.notConfigured()
  try {
    return await vercel.listProjects(connection)
  } catch (error) {
    if (error instanceof VercelAuthorizationError) {
      throw errors.accessUnavailable()
    }
    throw errors.projectsUnavailable()
  }
}

const status = base
  .input(z.object({ slug: z.string().min(1) }))
  .errors(errors)
  .use(authGuard)
  .handler(async ({ context, input, errors }) => {
    const workspace = await findOrganizationForMember(
      context.user.id,
      input.slug
    )
    if (!workspace) throw errors.ORGANIZATION_ACCESS_DENIED()
    const [connection] = await db
      .select({
        accountName: vercelOrganizationConnection.accountName,
        teamId: vercelOrganizationConnection.teamId,
        createdAt: vercelOrganizationConnection.createdAt,
      })
      .from(vercelOrganizationConnection)
      .where(eq(vercelOrganizationConnection.organizationId, workspace.id))
      .limit(1)
    return {
      connection: connection
        ? {
            accountName: connection.accountName,
            accountType: connection.teamId ? "team" : "personal",
            connectedAt: connection.createdAt.toISOString(),
          }
        : null,
      canManage: hasManagingRole(workspace.role),
      appConfigured: Boolean(connector() && serverEnv.VERCEL_INTEGRATION_SLUG),
    }
  })

const listProjects = base
  .input(z.object({ slug: z.string().min(1) }))
  .errors(errors)
  .use(authGuard)
  .handler(async ({ context, input, errors }) => {
    const workspace = await findOrganizationForMember(
      context.user.id,
      input.slug
    )
    if (!workspace) throw errors.ORGANIZATION_ACCESS_DENIED()
    const [connection] = await db
      .select({
        configurationId: vercelOrganizationConnection.configurationId,
        teamId: vercelOrganizationConnection.teamId,
      })
      .from(vercelOrganizationConnection)
      .where(eq(vercelOrganizationConnection.organizationId, workspace.id))
      .limit(1)
    if (!connection) throw errors.VERCEL_NOT_CONNECTED()
    const projects = await listProjectsFromVercel(connection, {
      notConfigured: errors.VERCEL_NOT_CONFIGURED,
      accessUnavailable: errors.VERCEL_ACCESS_UNAVAILABLE,
      projectsUnavailable: errors.VERCEL_PROJECTS_UNAVAILABLE,
    })
    return { projects }
  })

const mapping = base
  .input(
    z.object({
      slug: z.string().min(1),
      projectId: z.string().min(1),
    })
  )
  .errors(errors)
  .use(authGuard)
  .handler(async ({ context, input, errors }) => {
    const workspace = await findOrganizationForMember(
      context.user.id,
      input.slug
    )
    if (!workspace) throw errors.ORGANIZATION_ACCESS_DENIED()
    const [project] = await db
      .select({ id: githubProject.id })
      .from(githubProject)
      .where(
        and(
          eq(githubProject.id, input.projectId),
          eq(githubProject.organizationId, workspace.id)
        )
      )
      .limit(1)
    if (!project) throw errors.PROJECT_NOT_FOUND()
    const [result] = await db
      .select({
        id: vercelProjectMapping.id,
        vercelProjectId: vercelProjectMapping.vercelProjectId,
        vercelProjectName: vercelProjectMapping.vercelProjectName,
      })
      .from(vercelProjectMapping)
      .where(eq(vercelProjectMapping.projectId, project.id))
      .limit(1)
    return {
      mapping: result ?? null,
      canManage: hasManagingRole(workspace.role),
    }
  })

const setMapping = base
  .input(
    z.object({
      slug: z.string().min(1),
      projectId: z.string().min(1),
      vercelProjectId: z.string().min(1).nullable(),
    })
  )
  .errors(errors)
  .use(authGuard)
  .handler(async ({ context, input, errors }) => {
    const workspace = await findOrganizationForMember(
      context.user.id,
      input.slug
    )
    if (!workspace || !hasManagingRole(workspace.role)) {
      throw errors.ORGANIZATION_ACCESS_DENIED()
    }
    const [project] = await db
      .select({ id: githubProject.id })
      .from(githubProject)
      .where(
        and(
          eq(githubProject.id, input.projectId),
          eq(githubProject.organizationId, workspace.id)
        )
      )
      .limit(1)
    if (!project) throw errors.PROJECT_NOT_FOUND()

    if (input.vercelProjectId === null) {
      await db
        .delete(vercelProjectMapping)
        .where(eq(vercelProjectMapping.projectId, project.id))
      return { mapping: null }
    }

    const [connection] = await db
      .select({
        configurationId: vercelOrganizationConnection.configurationId,
        teamId: vercelOrganizationConnection.teamId,
      })
      .from(vercelOrganizationConnection)
      .where(eq(vercelOrganizationConnection.organizationId, workspace.id))
      .limit(1)
    if (!connection) throw errors.VERCEL_NOT_CONNECTED()
    const accessibleProjects = await listProjectsFromVercel(connection, {
      notConfigured: errors.VERCEL_NOT_CONFIGURED,
      accessUnavailable: errors.VERCEL_ACCESS_UNAVAILABLE,
      projectsUnavailable: errors.VERCEL_PROJECTS_UNAVAILABLE,
    })
    const selected = accessibleProjects.find(
      (item) => item.id === input.vercelProjectId
    )
    if (!selected) throw errors.VERCEL_PROJECT_NOT_ACCESSIBLE()

    const [existing] = await db
      .select({ projectId: vercelProjectMapping.projectId })
      .from(vercelProjectMapping)
      .where(
        and(
          eq(vercelProjectMapping.organizationId, workspace.id),
          eq(vercelProjectMapping.vercelProjectId, selected.id)
        )
      )
      .limit(1)
    if (existing && existing.projectId !== project.id) {
      throw errors.VERCEL_PROJECT_ALREADY_MAPPED()
    }
    const now = new Date()
    let saved:
      | {
          id: string
          vercelProjectId: string
          vercelProjectName: string
        }
      | undefined
    try {
      const savedRows = await db
        .insert(vercelProjectMapping)
        .values({
          id: randomUUID(),
          organizationId: workspace.id,
          projectId: project.id,
          vercelProjectId: selected.id,
          vercelProjectName: selected.name,
          updatedByUserId: context.user.id,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: vercelProjectMapping.projectId,
          set: {
            organizationId: workspace.id,
            vercelProjectId: selected.id,
            vercelProjectName: selected.name,
            updatedByUserId: context.user.id,
            updatedAt: now,
          },
        })
        .returning({
          id: vercelProjectMapping.id,
          vercelProjectId: vercelProjectMapping.vercelProjectId,
          vercelProjectName: vercelProjectMapping.vercelProjectName,
        })
      saved = savedRows[0]
    } catch (error) {
      const [concurrentMapping] = await db
        .select({ projectId: vercelProjectMapping.projectId })
        .from(vercelProjectMapping)
        .where(
          and(
            eq(vercelProjectMapping.organizationId, workspace.id),
            eq(vercelProjectMapping.vercelProjectId, selected.id)
          )
        )
        .limit(1)
      if (concurrentMapping && concurrentMapping.projectId !== project.id) {
        throw errors.VERCEL_PROJECT_ALREADY_MAPPED()
      }
      throw error
    }
    if (!saved) throw errors.VERCEL_PROJECTS_UNAVAILABLE()
    return { mapping: saved }
  })

const disconnect = base
  .input(z.object({ slug: z.string().min(1) }))
  .errors(errors)
  .use(authGuard)
  .handler(async ({ context, input, errors }) => {
    const workspace = await findOrganizationForMember(
      context.user.id,
      input.slug
    )
    if (!workspace || !hasManagingRole(workspace.role)) {
      throw errors.ORGANIZATION_ACCESS_DENIED()
    }
    await db.transaction(async (tx) => {
      await tx
        .delete(vercelProjectMapping)
        .where(eq(vercelProjectMapping.organizationId, workspace.id))
      await tx
        .delete(vercelOrganizationConnection)
        .where(eq(vercelOrganizationConnection.organizationId, workspace.id))
    })
    return { disconnected: true }
  })

export const vercelRouter = {
  status,
  listProjects,
  mapping,
  setMapping,
  disconnect,
}
