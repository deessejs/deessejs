/**
 * @testClass integration
 * @database postgres
 *
 * Exercises the persisted membership and subscription boundary used by the
 * entitlement resolver and public metadata routes.
 */
import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { call } from "@orpc/server"
import { describe, expect, inject, it } from "vitest"
import { db } from "@workspace/database"
import {
  blockPublications,
  member,
  organization,
  session,
  subscription,
  templateRepositorySnapshots,
  templates,
  user,
} from "@workspace/database/schema"
import { appRouter } from "../../../src/orpc/index.js"

const POSTGRES_READY = inject("postgres:ready") === true

describe("organization Pro entitlement and public metadata", () => {
  if (!POSTGRES_READY) {
    it.skip("requires Postgres", () => {})
    return
  }

  it("re-checks membership, isolates organizations, and hides paid metadata without Pro", async () => {
    const suffix = randomUUID()
    const userId = `pro-user-${suffix}`
    const secondUserId = `pro-seat-user-${suffix}`
    const orgA = `pro-org-a-${suffix}`
    const orgB = `pro-org-b-${suffix}`
    const slugA = `pro-a-${suffix.slice(0, 8)}`
    const slugB = `pro-b-${suffix.slice(0, 8)}`
    const paidTemplateId = randomUUID()
    const freeTemplateId = randomUUID()
    const paidBlockId = randomUUID()
    const freeBlockId = randomUUID()
    const context = {
      headers: new Headers(),
      user: { id: userId },
      session: { activeOrganizationId: orgA },
      requestId: "pro-entitlement-test",
    } as never

    try {
      await db.insert(user).values([
        {
          id: userId,
          name: userId,
          email: `${userId}@example.test`,
          emailVerified: true,
        },
        {
          id: secondUserId,
          name: secondUserId,
          email: `${secondUserId}@example.test`,
          emailVerified: true,
        },
      ])
      await db.insert(organization).values([
        { id: orgA, name: orgA, slug: slugA, createdAt: new Date() },
        { id: orgB, name: orgB, slug: slugB, createdAt: new Date() },
      ])
      await db.insert(member).values([
        {
          id: `member-${suffix}`,
          organizationId: orgA,
          userId,
          role: "member",
          createdAt: new Date(),
        },
        {
          id: `second-member-${suffix}`,
          organizationId: orgA,
          userId: secondUserId,
          role: "member",
          createdAt: new Date(),
        },
      ])
      await db.insert(subscription).values({
        id: `subscription-${suffix}`,
        plan: "pro",
        billingInterval: "month",
        referenceId: orgB,
        status: "active",
        seats: 1,
      })
      await db.insert(templates).values([
        {
          id: paidTemplateId,
          slug: `paid-${suffix}`,
          ownerType: "platform",
          organizationId: null,
          name: "Paid fixture",
          owner: "deessejs",
          repo: "paid-fixture",
          category: "saas",
          access: "paid",
        },
        {
          id: freeTemplateId,
          slug: `free-${suffix}`,
          ownerType: "platform",
          organizationId: null,
          name: "Free fixture",
          owner: "deessejs",
          repo: "free-fixture",
          category: "saas",
          access: "free",
        },
      ])
      await db.insert(templateRepositorySnapshots).values([
        {
          templateId: paidTemplateId,
          repositoryName: "paid-fixture",
          canonicalUrl: "https://github.com/deessejs/paid-fixture",
        },
        {
          templateId: freeTemplateId,
          repositoryName: "free-fixture",
          canonicalUrl: "https://github.com/deessejs/free-fixture",
        },
      ])
      await db.insert(blockPublications).values([
        {
          id: paidBlockId,
          ownerType: "platform",
          organizationId: null,
          organizationSlug: null,
          submittedBy: userId,
          slug: `paid-block-${suffix}`,
          name: "Paid block fixture",
          category: "layout",
          repositoryUrl: "deessejs/paid-block-fixture",
          sourceCommit: "a".repeat(40),
          descriptor: JSON.stringify({ fixture: "paid" }),
          reviewStatus: "approved",
          publicationState: "current",
          access: "paid",
        },
        {
          id: freeBlockId,
          ownerType: "platform",
          organizationId: null,
          organizationSlug: null,
          submittedBy: userId,
          slug: `free-block-${suffix}`,
          name: "Free block fixture",
          category: "layout",
          repositoryUrl: "deessejs/free-block-fixture",
          sourceCommit: "b".repeat(40),
          descriptor: JSON.stringify({ fixture: "free" }),
          reviewStatus: "approved",
          publicationState: "current",
          access: "free",
        },
      ])

      const anonymousContext = {
        headers: new Headers(),
        user: null,
        session: null,
        requestId: "pro-entitlement-anonymous-test",
      }
      const anonymousTemplates = await call(
        appRouter.templates.list,
        undefined,
        {
          context: anonymousContext,
        }
      )
      expect(
        anonymousTemplates.templates.map((template) => template.slug)
      ).toContain(`free-${suffix}`)
      expect(
        anonymousTemplates.templates.map((template) => template.slug)
      ).not.toContain(`paid-${suffix}`)
      await expect(
        call(
          appRouter.templates.detail,
          { slug: `paid-${suffix}` },
          { context: anonymousContext }
        )
      ).resolves.toBeNull()
      await expect(
        call(
          appRouter.templates.resolve,
          { slug: `paid-${suffix}` },
          { context: anonymousContext }
        )
      ).resolves.toBeNull()

      const anonymousBlocks = await call(appRouter.blocks.list, undefined, {
        context: anonymousContext,
      })
      expect(anonymousBlocks.blocks.map((block) => block.slug)).toContain(
        `free-block-${suffix}`
      )
      expect(anonymousBlocks.blocks.map((block) => block.slug)).not.toContain(
        `paid-block-${suffix}`
      )
      await expect(
        call(
          appRouter.blocks.resolve,
          { organizationSlug: "official", slug: `paid-block-${suffix}` },
          { context: anonymousContext }
        )
      ).resolves.toMatchObject({ block: null })

      const paidOnlyForB = await call(appRouter.templates.list, undefined, {
        context,
      })
      expect(
        paidOnlyForB.templates.map((template) => template.slug)
      ).not.toContain(`paid-${suffix}`)

      await db.insert(subscription).values([
        {
          id: `subscription-a-history-${suffix}`,
          plan: "pro",
          billingInterval: "month",
          referenceId: orgA,
          status: "canceled",
          endedAt: new Date(),
          seats: 2,
        },
        {
          id: `subscription-a-current-${suffix}`,
          plan: "pro",
          billingInterval: "month",
          referenceId: orgA,
          status: "active",
          seats: 1,
        },
      ])
      await expect(
        call(
          appRouter.organization.proEntitlement,
          { slug: slugA },
          { context }
        )
      ).resolves.toEqual({ proIncluded: false })
      await expect(
        call(
          appRouter.organization.setProSeatAssignment,
          { slug: slugA, memberId: `member-${suffix}`, assigned: true },
          { context }
        )
      ).rejects.toMatchObject({ code: "ORGANIZATION_ACCESS_DENIED" })
      await db
        .update(member)
        .set({ role: "owner" })
        .where(eq(member.id, `member-${suffix}`))
      await expect(
        call(
          appRouter.organization.setProSeatAssignment,
          { slug: slugA, memberId: `member-${suffix}`, assigned: true },
          { context }
        )
      ).resolves.toEqual({ assigned: true })
      await expect(
        call(
          appRouter.organization.setProSeatAssignment,
          {
            slug: slugA,
            memberId: `second-member-${suffix}`,
            assigned: true,
          },
          { context }
        )
      ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" })
      const memberEntitlement = await call(
        appRouter.organization.proEntitlement,
        { slug: slugA },
        { context }
      )
      expect(memberEntitlement).toEqual({ proIncluded: true })
      const paidTemplatesForA = await call(
        appRouter.templates.list,
        undefined,
        {
          context,
        }
      )
      expect(
        paidTemplatesForA.templates.map((template) => template.slug)
      ).toContain(`paid-${suffix}`)
      const paidBlocksForA = await call(appRouter.blocks.list, undefined, {
        context,
      })
      expect(paidBlocksForA.blocks.map((block) => block.slug)).toContain(
        `paid-block-${suffix}`
      )

      await expect(
        call(
          appRouter.organization.proEntitlement,
          { slug: slugB },
          { context }
        )
      ).rejects.toThrow()

      await db.delete(member).where(eq(member.organizationId, orgA))
      const afterRemoval = await call(appRouter.templates.list, undefined, {
        context,
      })
      expect(
        afterRemoval.templates.map((template) => template.slug)
      ).not.toContain(`paid-${suffix}`)
    } finally {
      await db
        .delete(blockPublications)
        .where(eq(blockPublications.id, paidBlockId))
      await db
        .delete(blockPublications)
        .where(eq(blockPublications.id, freeBlockId))
      await db
        .delete(templateRepositorySnapshots)
        .where(eq(templateRepositorySnapshots.templateId, paidTemplateId))
      await db
        .delete(templateRepositorySnapshots)
        .where(eq(templateRepositorySnapshots.templateId, freeTemplateId))
      await db.delete(templates).where(eq(templates.id, paidTemplateId))
      await db.delete(templates).where(eq(templates.id, freeTemplateId))
      await db.delete(subscription).where(eq(subscription.referenceId, orgA))
      await db.delete(subscription).where(eq(subscription.referenceId, orgB))
      await db.delete(member).where(eq(member.organizationId, orgA))
      await db.delete(session).where(eq(session.userId, userId))
      await db.delete(organization).where(eq(organization.id, orgA))
      await db.delete(organization).where(eq(organization.id, orgB))
      await db.delete(user).where(eq(user.id, userId))
      await db.delete(user).where(eq(user.id, secondUserId))
    }
  })
})
