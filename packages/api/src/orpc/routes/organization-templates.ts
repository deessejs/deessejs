import { and, asc, desc, eq, inArray } from "drizzle-orm"
import { z } from "zod"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import {
  db,
  member,
  organization,
  templatePublications,
  templateRepositorySnapshots,
  templates,
} from "@workspace/database"
import { CATEGORY_SLUGS } from "../../templates-labels.js"
import {
  acquireTemplateRepository,
  InvalidTemplateSourceError,
  acquireTemplateRepositoryRevision,
  TemplateSourceFetchError,
} from "../../core/templates/admin.js"
import {
  InvalidTemplatePublicationSourceError,
  validateTemplatePublicationSource,
} from "../../core/templates/validate-publication-source.js"
import { findOrganizationForMember } from "../../core/organization/membership.js"
import { authGuard } from "../auth-middleware.js"
import { base } from "../base.js"

const accessDeniedErrors = {
  ORGANIZATION_ACCESS_DENIED: {
    status: 403,
    message: "You cannot access this organization.",
  },
}

const listInput = z.object({ organizationSlug: z.string().min(1) })

const resolveOrganizationForInput = async (
  userId: string,
  organizationSlug: string
) => findOrganizationForMember(userId, organizationSlug)

const organizationTemplate = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  owner: z.string(),
  repo: z.string(),
  category: z.string(),
  labels: z.array(z.string()),
  license: z.string(),
  canonicalUrl: z.string().url(),
  repositoryName: z.string(),
  stars: z.number().int().nonnegative().nullable(),
  fetchedAt: z.string().datetime(),
  currentlyPublished: z.boolean(),
  publication: z
    .object({
      reviewStatus: z.enum(["pending", "approved", "rejected", "withdrawn"]),
      publicationState: z.enum([
        "unpublished",
        "current",
        "superseded",
        "removed",
      ]),
      submittedAt: z.string().datetime(),
      reviewReason: z.string().nullable(),
    })
    .nullable(),
})

const listOutput = z.object({ templates: z.array(organizationTemplate) })

export const list = base
  .input(listInput)
  .errors(accessDeniedErrors)
  .use(authGuard)
  .use(async (options, input) => {
    const org = await resolveOrganizationForInput(
      options.context.user.id,
      input.organizationSlug
    )
    if (!org) throw options.errors.ORGANIZATION_ACCESS_DENIED()
    return options.next({
      context: { ...options.context, organization: org },
    })
  })

  .output(listOutput)
  .handler(async ({ context }) => {
    const rows = await db
      .select({
        id: templates.id,
        slug: templates.slug,
        name: templates.name,
        descriptionOverride: templates.descriptionOverride,
        owner: templates.owner,
        repo: templates.repo,
        category: templates.category,
        labels: templates.labels,
        licenseFallback: templates.licenseFallback,
        canonicalUrl: templateRepositorySnapshots.canonicalUrl,
        repositoryName: templateRepositorySnapshots.repositoryName,
        repositoryDescription:
          templateRepositorySnapshots.repositoryDescription,
        snapshotLicense: templateRepositorySnapshots.license,
        stars: templateRepositorySnapshots.stars,
        fetchedAt: templateRepositorySnapshots.fetchedAt,
      })
      .from(templates)
      .innerJoin(
        templateRepositorySnapshots,
        eq(templates.id, templateRepositorySnapshots.templateId)
      )
      .where(
        and(
          eq(templates.ownerType, "organization"),
          eq(templates.organizationId, context.organization.id)
        )
      )
      .orderBy(asc(templates.name), asc(templates.slug))

    const currentPublications =
      rows.length > 0
        ? await db
            .select({ templateId: templatePublications.templateId })
            .from(templatePublications)
            .where(
              and(
                inArray(
                  templatePublications.templateId,
                  rows.map((row) => row.id)
                ),
                eq(templatePublications.publicationState, "current")
              )
            )
        : []
    const currentlyPublished = new Set(
      currentPublications.map((publication) => publication.templateId)
    )

    const publications =
      rows.length > 0
        ? await db
            .select({
              templateId: templatePublications.templateId,
              reviewStatus: templatePublications.reviewStatus,
              publicationState: templatePublications.publicationState,
              submittedAt: templatePublications.submittedAt,
              reviewReason: templatePublications.reviewReason,
            })
            .from(templatePublications)
            .where(
              inArray(
                templatePublications.templateId,
                rows.map((row) => row.id)
              )
            )
            .orderBy(desc(templatePublications.submittedAt))
        : []
    const latestByTemplate = new Map<string, (typeof publications)[number]>()
    for (const publication of publications) {
      if (!latestByTemplate.has(publication.templateId)) {
        latestByTemplate.set(publication.templateId, publication)
      }
    }

    return {
      templates: rows.map((row) => {
        const publication = latestByTemplate.get(row.id)
        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          description:
            row.descriptionOverride ?? row.repositoryDescription ?? "",
          owner: row.owner,
          repo: row.repo,
          category: row.category,
          labels: row.labels,
          license: row.licenseFallback ?? row.snapshotLicense ?? "",
          canonicalUrl: row.canonicalUrl,
          repositoryName: row.repositoryName,
          stars: row.stars,
          fetchedAt: row.fetchedAt.toISOString(),
          currentlyPublished: currentlyPublished.has(row.id),
          publication: publication
            ? {
                reviewStatus: publication.reviewStatus,
                publicationState: publication.publicationState,
                submittedAt: publication.submittedAt.toISOString(),
                reviewReason: publication.reviewReason,
              }
            : null,
        }
      }),
    }
  })

const createInput = z.object({
  organizationSlug: z.string().min(1),
  slug: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  repositoryUrl: z.string().trim().min(1).max(2048),
  descriptionOverride: z.string().trim().max(10000).nullable().optional(),
  category: z.enum(CATEGORY_SLUGS),
  labels: z.array(z.string().trim().min(1).max(64)).max(50),
  licenseFallback: z.string().trim().max(128).nullable().optional(),
})

const createOutput = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
})

const createErrors = {
  ...accessDeniedErrors,
  TEMPLATE_SLUG_CONFLICT: {
    status: 409,
    message: "This organization already has a template with this slug.",
  },
  TEMPLATE_GITHUB_SOURCE_INVALID: {
    status: 422,
    message: "Use a URL to a public GitHub repository.",
  },
  TEMPLATE_GITHUB_FETCH_FAILED: {
    status: 502,
    message: "GitHub data could not be fetched. Check the URL and try again.",
  },
}

function hasPostgresCode(error: unknown, code: string): boolean {
  let current: unknown = error
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current !== "object" || current === null) return false
    if ("code" in current && current.code === code) return true
    current = "cause" in current ? current.cause : null
  }
  return false
}

export const create = base
  .input(createInput)
  .errors(createErrors)
  .use(authGuard)
  .use(async (options, input) => {
    const org = await resolveOrganizationForInput(
      options.context.user.id,
      input.organizationSlug
    )
    if (!org) throw options.errors.ORGANIZATION_ACCESS_DENIED()
    return options.next({
      context: { ...options.context, organization: org },
    })
  })
  .output(createOutput)
  .handler(async ({ context, input, errors }) => {
    if (!hasManagingRole(context.organization.role)) {
      throw errors.ORGANIZATION_ACCESS_DENIED()
    }

    let acquired: Awaited<ReturnType<typeof acquireTemplateRepository>>
    try {
      acquired = await acquireTemplateRepository(input.repositoryUrl)
    } catch (error) {
      if (error instanceof InvalidTemplateSourceError) {
        throw errors.TEMPLATE_GITHUB_SOURCE_INVALID()
      }
      if (error instanceof TemplateSourceFetchError) {
        throw errors.TEMPLATE_GITHUB_FETCH_FAILED()
      }
      throw error
    }

    try {
      return await db.transaction(async (tx) => {
        // Recheck membership and role after GitHub I/O, immediately before
        // writing, so a revoked member cannot finish a request in flight.
        const [actor] = await tx
          .select({ role: member.role })
          .from(member)
          .innerJoin(organization, eq(member.organizationId, organization.id))
          .where(
            and(
              eq(member.userId, context.user.id),
              eq(organization.id, context.organization.id)
            )
          )
          .limit(1)

        if (!actor || !hasManagingRole(actor.role)) {
          throw errors.ORGANIZATION_ACCESS_DENIED()
        }

        const [duplicate] = await tx
          .select({ id: templates.id })
          .from(templates)
          .where(
            and(
              eq(templates.ownerType, "organization"),
              eq(templates.organizationId, context.organization.id),
              eq(templates.slug, input.slug)
            )
          )
          .limit(1)
        if (duplicate) throw errors.TEMPLATE_SLUG_CONFLICT()

        const [template] = await tx
          .insert(templates)
          .values({
            ownerType: "organization",
            organizationId: context.organization.id,
            slug: input.slug,
            name: input.name,
            descriptionOverride: input.descriptionOverride || null,
            owner: acquired.owner,
            repo: acquired.repo,
            category: input.category,
            labels: input.labels,
            licenseFallback: input.licenseFallback || null,
            access: "free",
            imageName: null,
            sortOrder: 0,
          })
          .returning({
            id: templates.id,
            slug: templates.slug,
            name: templates.name,
          })

        if (!template) throw new Error("Template insert returned no row.")

        await tx.insert(templateRepositorySnapshots).values({
          templateId: template.id,
          ...acquired.snapshot,
        })

        return template
      })
    } catch (error) {
      if (hasPostgresCode(error, "23505")) {
        throw errors.TEMPLATE_SLUG_CONFLICT()
      }
      throw error
    }
  })

const submitInput = z.object({
  organizationSlug: z.string().min(1),
  templateId: z.string().uuid(),
  distributionRightsConfirmed: z.literal(true),
})

const submissionOutput = z.object({
  id: z.string().uuid(),
  sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
})

const submissionErrors = {
  ...accessDeniedErrors,
  TEMPLATE_SUBMISSION_CONFLICT: {
    status: 409,
    message: "This template already has a pending publication request.",
  },
  TEMPLATE_SLUG_INVALID: {
    status: 422,
    message:
      "Use a lowercase template slug with letters, numbers, and hyphens.",
  },
  TEMPLATE_LICENSE_REQUIRED: {
    status: 422,
    message: "A repository license is required before publication review.",
  },
  TEMPLATE_GITHUB_SOURCE_INVALID: {
    status: 422,
    message: "The template must use a public GitHub repository.",
  },
  TEMPLATE_GITHUB_FETCH_FAILED: {
    status: 502,
    message: "GitHub could not provide a fixed source revision. Try again.",
  },
  TEMPLATE_DESCRIPTOR_INVALID: {
    status: 422,
    message:
      'The selected commit must contain an installable "deesse-template.json" descriptor.',
  },
}

export const submit = base
  .input(submitInput)
  .errors(submissionErrors)
  .use(authGuard)
  .use(async (options, input) => {
    const org = await resolveOrganizationForInput(
      options.context.user.id,
      input.organizationSlug
    )
    if (!org) throw options.errors.ORGANIZATION_ACCESS_DENIED()
    return options.next({
      context: { ...options.context, organization: org },
    })
  })
  .output(submissionOutput)
  .handler(async ({ context, input, errors }) => {
    if (!hasManagingRole(context.organization.role)) {
      throw errors.ORGANIZATION_ACCESS_DENIED()
    }

    const [template] = await db
      .select({
        id: templates.id,
        slug: templates.slug,
        name: templates.name,
        descriptionOverride: templates.descriptionOverride,
        owner: templates.owner,
        repo: templates.repo,
        category: templates.category,
        labels: templates.labels,
        imageName: templates.imageName,
        licenseFallback: templates.licenseFallback,
      })
      .from(templates)
      .where(
        and(
          eq(templates.id, input.templateId),
          eq(templates.ownerType, "organization"),
          eq(templates.organizationId, context.organization.id)
        )
      )
      .limit(1)

    if (!template) throw errors.ORGANIZATION_ACCESS_DENIED()
    if (!/^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/.test(template.slug)) {
      throw errors.TEMPLATE_SLUG_INVALID()
    }

    let acquired: Awaited<ReturnType<typeof acquireTemplateRepositoryRevision>>
    try {
      acquired = await acquireTemplateRepositoryRevision(
        `https://github.com/${template.owner}/${template.repo}`
      )
    } catch (error) {
      if (error instanceof InvalidTemplateSourceError) {
        throw errors.TEMPLATE_GITHUB_SOURCE_INVALID()
      }
      if (error instanceof TemplateSourceFetchError) {
        throw errors.TEMPLATE_GITHUB_FETCH_FAILED()
      }
      throw error
    }

    const license = template.licenseFallback ?? acquired.snapshot.license
    if (!license?.trim()) throw errors.TEMPLATE_LICENSE_REQUIRED()

    try {
      await validateTemplatePublicationSource(
        acquired.owner,
        acquired.repo,
        acquired.sourceCommit
      )
    } catch (error) {
      if (error instanceof InvalidTemplatePublicationSourceError) {
        throw errors.TEMPLATE_DESCRIPTOR_INVALID()
      }
      throw errors.TEMPLATE_GITHUB_FETCH_FAILED()
    }

    try {
      return await db.transaction(async (tx) => {
        const [actor] = await tx
          .select({ role: member.role })
          .from(member)
          .innerJoin(organization, eq(member.organizationId, organization.id))
          .where(
            and(
              eq(member.userId, context.user.id),
              eq(organization.id, context.organization.id)
            )
          )
          .limit(1)

        if (!actor || !hasManagingRole(actor.role)) {
          throw errors.ORGANIZATION_ACCESS_DENIED()
        }

        const [pending] = await tx
          .select({ id: templatePublications.id })
          .from(templatePublications)
          .where(
            and(
              eq(templatePublications.templateId, template.id),
              eq(templatePublications.reviewStatus, "pending")
            )
          )
          .limit(1)
        if (pending) throw errors.TEMPLATE_SUBMISSION_CONFLICT()

        const [publication] = await tx
          .insert(templatePublications)
          .values({
            templateId: template.id,
            organizationId: context.organization.id,
            organizationSlug: context.organization.slug,
            organizationName: context.organization.name,
            submittedBy: context.user.id,
            sourceCommit: acquired.sourceCommit,
            slug: template.slug,
            name: template.name,
            description:
              template.descriptionOverride ??
              acquired.snapshot.repositoryDescription ??
              "",
            owner: acquired.owner,
            repo: acquired.repo,
            category: template.category,
            labels: template.labels,
            imageName: template.imageName,
            license,
            repositoryName: acquired.snapshot.repositoryName,
            canonicalUrl: acquired.snapshot.canonicalUrl,
            repositoryDescription: acquired.snapshot.repositoryDescription,
            readme: acquired.snapshot.readme,
            stars: acquired.snapshot.stars,
            repositoryUpdatedAt: acquired.snapshot.repositoryUpdatedAt,
            distributionRightsConfirmed: input.distributionRightsConfirmed,
          })
          .returning({
            id: templatePublications.id,
            sourceCommit: templatePublications.sourceCommit,
          })

        if (!publication) {
          throw new Error("Template publication insert returned no row.")
        }
        return publication
      })
    } catch (error) {
      if (hasPostgresCode(error, "23505")) {
        throw errors.TEMPLATE_SUBMISSION_CONFLICT()
      }
      throw error
    }
  })

export const withdraw = base
  .input(
    z.object({
      organizationSlug: z.string().min(1),
      templateId: z.string().uuid(),
    })
  )
  .errors({
    ...accessDeniedErrors,
    TEMPLATE_SUBMISSION_NOT_PENDING: {
      status: 409,
      message: "There is no pending publication request to withdraw.",
    },
  })
  .use(authGuard)
  .use(async (options, input) => {
    const org = await resolveOrganizationForInput(
      options.context.user.id,
      input.organizationSlug
    )
    if (!org) throw options.errors.ORGANIZATION_ACCESS_DENIED()
    return options.next({
      context: { ...options.context, organization: org },
    })
  })
  .output(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, input, errors }) => {
    if (!hasManagingRole(context.organization.role)) {
      throw errors.ORGANIZATION_ACCESS_DENIED()
    }

    return db.transaction(async (tx) => {
      const [actor] = await tx
        .select({ role: member.role })
        .from(member)
        .innerJoin(organization, eq(member.organizationId, organization.id))
        .where(
          and(
            eq(member.userId, context.user.id),
            eq(organization.id, context.organization.id)
          )
        )
        .limit(1)
      if (!actor || !hasManagingRole(actor.role)) {
        throw errors.ORGANIZATION_ACCESS_DENIED()
      }

      const [withdrawn] = await tx
        .update(templatePublications)
        .set({ reviewStatus: "withdrawn" })
        .where(
          and(
            eq(templatePublications.templateId, input.templateId),
            eq(templatePublications.organizationId, context.organization.id),
            eq(templatePublications.reviewStatus, "pending")
          )
        )
        .returning({ id: templatePublications.id })
      if (!withdrawn) throw errors.TEMPLATE_SUBMISSION_NOT_PENDING()
      return withdrawn
    })
  })

export const organizationTemplatesRouter = { list, create, submit, withdraw }
