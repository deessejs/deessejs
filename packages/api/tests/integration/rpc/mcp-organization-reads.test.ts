/**
 * @testClass integration
 * @database postgres
 *
 * The scoped MCP read procedures resolve current memberships and keep
 * project/template details inside the organization named by the caller.
 */
import { randomUUID } from "node:crypto"
import { inArray } from "drizzle-orm"
import { describe, expect, inject, it } from "vitest"
import { call } from "@orpc/server"
import { db } from "@workspace/database"
import {
  githubProject,
  githubProjectCheck,
  member,
  organization,
  templateRepositorySnapshots,
  templates,
  user,
} from "@workspace/database/schema"
import { resolveMcpUserId } from "../../../src/core/mcp/identity.js"
import { appRouter } from "../../../src/orpc/index.js"

const POSTGRES_READY = inject("postgres:ready") === true

describe("organization-scoped MCP reads", () => {
  if (!POSTGRES_READY) {
    it.skip("requires Postgres", () => {})
  } else {
    it("resolves current OAuth users, paginates lists, and hides cross-organization details", async () => {
      const suffix = randomUUID()
      const userId = `mcp-read-user-${suffix}`
      const otherUserId = `mcp-read-other-${suffix}`
      const orgId = `mcp-read-org-${suffix}`
      const otherOrgId = `mcp-read-other-org-${suffix}`
      const slug = `mcp-read-${suffix.slice(0, 8)}`
      const otherSlug = `mcp-other-${suffix.slice(0, 8)}`
      const projectIds: [string, string] = [randomUUID(), randomUUID()]
      const otherProjectId = randomUUID()
      const templateIds: [string, string] = [randomUUID(), randomUUID()]
      const otherTemplateId = randomUUID()
      const allTemplateIds = [...templateIds, otherTemplateId]

      try {
        await db.insert(user).values([
          {
            id: userId,
            name: userId,
            email: `${userId}@example.com`,
            emailVerified: true,
          },
          {
            id: otherUserId,
            name: otherUserId,
            email: `${otherUserId}@example.com`,
            emailVerified: true,
          },
        ])
        await db.insert(organization).values([
          { id: orgId, name: orgId, slug, createdAt: new Date() },
          {
            id: otherOrgId,
            name: otherOrgId,
            slug: otherSlug,
            createdAt: new Date(),
          },
        ])
        await db.insert(member).values([
          {
            id: randomUUID(),
            organizationId: orgId,
            userId,
            role: "member",
            createdAt: new Date(),
          },
          {
            id: randomUUID(),
            organizationId: otherOrgId,
            userId: otherUserId,
            role: "owner",
            createdAt: new Date(),
          },
        ])
        await db.insert(githubProject).values(
          [...projectIds, otherProjectId].map((id, index) => ({
            id,
            organizationId: index === 2 ? otherOrgId : orgId,
            repositoryId: `repo-${id}`,
            repositoryFullName: `owner/project-${index}`,
            repositoryUrl: `https://github.com/owner/project-${index}`,
            isPrivate: true,
            defaultBranch: "main",
            configurationPath: "deesse.json",
          }))
        )
        await db.insert(githubProjectCheck).values(
          [...projectIds, otherProjectId].map((id) => ({
            id: randomUUID(),
            projectId: id,
            status: "valid" as const,
            commitSha: "a".repeat(40),
            formatVersion: 1,
            pathCount: 2,
            aliasCount: 0,
            checkedAt: new Date(),
          }))
        )
        await db.insert(templates).values(
          allTemplateIds.map((id, index) => ({
            id,
            slug: `template-${index}`,
            ownerType: "organization" as const,
            organizationId: index === 2 ? otherOrgId : orgId,
            name: `Template ${index}`,
            owner: "fixture-owner",
            repo: `template-${index}`,
            category: "saas",
          }))
        )
        await db.insert(templateRepositorySnapshots).values(
          allTemplateIds.map((id, index) => ({
            templateId: id,
            repositoryName: `template-${index}`,
            canonicalUrl: `https://github.com/fixture-owner/template-${index}`,
          }))
        )

        expect(await resolveMcpUserId(userId)).toBe(userId)
        expect(await resolveMcpUserId(`deleted-${suffix}`)).toBeNull()

        const context = {
          headers: new Headers(),
          user: null,
          session: null,
          requestId: "mcp-organization-read",
          mcpIdentity: {
            userId,
            scopes: [
              "organizations:projects:read",
              "organizations:templates:read",
            ],
          },
        }
        const projectPage = await call(
          appRouter.githubApp.projects.list,
          { slug, page: 1, pageSize: 1 },
          { context }
        )
        expect(projectPage.projects).toHaveLength(1)
        expect(projectPage.pagination).toEqual({
          page: 1,
          pageSize: 1,
          hasMore: true,
        })
        const projectDetail = await call(
          appRouter.githubApp.projects.get,
          { slug, projectId: projectIds[0] },
          { context }
        )
        expect(projectDetail.project.id).toBe(projectIds[0])

        const templatePage = await call(
          appRouter.organization.templates.list,
          { organizationSlug: slug, page: 1, pageSize: 1 },
          { context }
        )
        expect(templatePage.templates).toHaveLength(1)
        expect(templatePage.pagination).toEqual({
          page: 1,
          pageSize: 1,
          hasMore: true,
        })
        const templateDetail = await call(
          appRouter.organization.templates.get,
          { organizationSlug: slug, templateId: templateIds[0] },
          { context }
        )
        expect(templateDetail.template.id).toBe(templateIds[0])

        await expect(
          call(
            appRouter.githubApp.projects.get,
            { slug, projectId: otherProjectId },
            { context }
          )
        ).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" })
        await expect(
          call(
            appRouter.organization.templates.get,
            { organizationSlug: slug, templateId: otherTemplateId },
            { context }
          )
        ).rejects.toMatchObject({ code: "ORGANIZATION_ACCESS_DENIED" })
        await expect(
          call(
            appRouter.organization.templates.get,
            { organizationSlug: otherSlug, templateId: otherTemplateId },
            { context }
          )
        ).rejects.toMatchObject({ code: "ORGANIZATION_ACCESS_DENIED" })
      } finally {
        await db
          .delete(githubProjectCheck)
          .where(
            inArray(githubProjectCheck.projectId, [
              ...projectIds,
              otherProjectId,
            ])
          )
        await db
          .delete(githubProject)
          .where(inArray(githubProject.id, [...projectIds, otherProjectId]))
        await db
          .delete(templateRepositorySnapshots)
          .where(
            inArray(templateRepositorySnapshots.templateId, allTemplateIds)
          )
        await db.delete(templates).where(inArray(templates.id, allTemplateIds))
        await db
          .delete(member)
          .where(inArray(member.userId, [userId, otherUserId]))
        await db
          .delete(organization)
          .where(inArray(organization.id, [orgId, otherOrgId]))
        await db.delete(user).where(inArray(user.id, [userId, otherUserId]))
      }
    })
  }
})
