/**
 * @testClass integration
 * @database postgres
 *
 * Verify that public community template reads expose only current approved
 * publications at the database boundary.
 */
import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { describe, expect, inject, it } from "vitest"
import { db } from "@workspace/database"
import {
  organization,
  templatePublications,
  templates,
  user,
} from "@workspace/database/schema"
import { api } from "../../../src/index.js"

const POSTGRES_READY = inject("postgres:ready") === true

describe("public community template reads", () => {
  if (!POSTGRES_READY) {
    it.skip("requires Postgres", () => {})
  } else {
    it("returns only approved current publications from summary and detail", async () => {
      const suffix = randomUUID()
      const organizationId = `community-read-${suffix}`
      const userId = `community-read-${suffix}`
      const orgSlug = `community-${suffix.slice(0, 8)}`
      const rows = [
        { slug: "visible", reviewStatus: "approved", publicationState: "current" },
        { slug: "pending", reviewStatus: "pending", publicationState: "current" },
        { slug: "unpublished", reviewStatus: "approved", publicationState: "unpublished" },
      ] as const
      const templateIds = rows.map(() => randomUUID())
      const publicationIds = rows.map(() => randomUUID())

      await db.insert(user).values({
        id: userId,
        name: userId,
        email: `${userId}@example.com`,
        emailVerified: true,
      })
      await db.insert(organization).values({
        id: organizationId,
        name: organizationId,
        slug: orgSlug,
        createdAt: new Date(),
      })

      try {
        await db.insert(templates).values(
          rows.map((row, index) => ({
            id: templateIds[index],
            slug: `${orgSlug}-${row.slug}`,
            ownerType: "organization" as const,
            organizationId,
            name: row.slug,
            owner: "fixture-owner",
            repo: row.slug,
            category: "saas",
          }))
        )
        await db.insert(templatePublications).values(
          rows.map((row, index) => ({
            id: publicationIds[index],
            templateId: templateIds[index],
            organizationId,
            organizationSlug: orgSlug,
            organizationName: organizationId,
            submittedBy: userId,
            reviewStatus: row.reviewStatus,
            publicationState: row.publicationState,
            sourceCommit: "a".repeat(40),
            slug: row.slug,
            name: row.slug,
            description: "Community template visibility fixture",
            owner: "fixture-owner",
            repo: row.slug,
            category: "saas",
            license: "MIT",
            repositoryName: row.slug,
            canonicalUrl: `https://github.com/fixture-owner/${row.slug}`,
            readme: `# ${row.slug}`,
            distributionRightsConfirmed: true,
          }))
        )

        const summaryResponse = await api.request(
          "/api/v1/rpc/templates/community/summary",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              data: null,
              path: ["templates", "community", "summary"],
            }),
          }
        )
        expect(summaryResponse.status).toBe(200)
        const summary = await summaryResponse.json()
        const summarySlugs = summary.json.templates.map(
          (template: { slug: string }) => template.slug
        )
        expect(summarySlugs).toContain(`@${orgSlug}/visible`)
        expect(summarySlugs).not.toContain(`@${orgSlug}/pending`)
        expect(summarySlugs).not.toContain(`@${orgSlug}/unpublished`)
        expect(summary.json.templates[0]).not.toHaveProperty("readme")

        for (const hiddenSlug of ["pending", "unpublished"]) {
          const hiddenResponse = await api.request(
            "/api/v1/rpc/templates/community/detail",
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                json: { organizationSlug: orgSlug, templateSlug: hiddenSlug },
                path: ["templates", "community", "detail"],
              }),
            }
          )
          expect(hiddenResponse.status).toBe(200)
          expect((await hiddenResponse.json()).json).toBeNull()
        }

        const detailResponse = await api.request(
          "/api/v1/rpc/templates/community/detail",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              json: { organizationSlug: orgSlug, templateSlug: "visible" },
              path: ["templates", "community", "detail"],
            }),
          }
        )
        expect(detailResponse.status).toBe(200)
        expect((await detailResponse.json()).json.readme).toBe("# visible")
      } finally {
        await db
          .delete(templatePublications)
          .where(eq(templatePublications.organizationId, organizationId))
        await db.delete(templates).where(eq(templates.organizationId, organizationId))
        await db.delete(organization).where(eq(organization.id, organizationId))
        await db.delete(user).where(eq(user.id, userId))
      }
    })
  }
})
