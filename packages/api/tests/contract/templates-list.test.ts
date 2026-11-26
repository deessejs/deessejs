/**
 * Contract tests for the public templates procedures.
 *
 * These tests exercise the route handlers without a network or database
 * connection and pin the projection from editorial and repository fields
 * onto the existing V1 wire shape.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

const { selectMock } = vi.hoisted(() => ({ selectMock: vi.fn() }))

vi.mock("../../src/core/organization/entitlement.js", () => ({
  callerHasActiveOrganizationPro: vi.fn().mockResolvedValue(true),
}))

vi.mock("@workspace/database", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/database")>()
  return { ...actual, db: { select: selectMock } }
})

import { call } from "@orpc/server"
import { appRouter } from "../../src/orpc/index.js"

const context = {
  headers: new Headers(),
  user: null,
  session: null,
  requestId: "test-request-id",
}

const templateRow = {
  id: "d355d22f-7eb9-4e14-9658-95170c2e1790",
  sourceType: "github" as const,
  slug: "saas-starter",
  name: "SaaS Starter",
  descriptionOverride: null,
  owner: "deessejs",
  repo: "saas-template",
  category: "saas",
  labels: ["nextjs", "saas", "auth"],
  licenseFallback: "MIT",
  imageName: "ship-your-saas.png",
  repositoryDescription: "A repository description",
  canonicalUrl: "https://github.com/deessejs/saas-template",
  license: "Apache-2.0",
  readme: "# SaaS Starter",
  repositoryUpdatedAt: new Date("2026-01-02T03:04:05.000Z"),
  stars: 42,
  access: "free" as const,
}

const mockQuery = (...resultSets: unknown[][]) => {
  selectMock.mockReset()
  let lastQuery: ReturnType<typeof createQuery> | undefined
  for (const rows of resultSets) {
    const query = createQuery()
    query.orderBy.mockResolvedValue(rows)
    query.limit.mockResolvedValue(rows)
    query.where.mockReturnValue(query)
    selectMock.mockReturnValueOnce(query)
    lastQuery = query
  }
  if (lastQuery) selectMock.mockReturnValue(lastQuery)
}

function createQuery() {
  const query = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    leftJoin: vi.fn(),
    orderBy: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  }
  query.from.mockReturnValue(query)
  query.innerJoin.mockReturnValue(query)
  query.leftJoin.mockReturnValue(query)
  query.where.mockReturnValue(query)
  return query
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("templates.list", () => {
  it("projects a compact catalog response without README", async () => {
    mockQuery([templateRow])

    const result = await call(appRouter.templates.list, undefined, { context })

    expect(selectMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ readme: expect.anything() })
    )
    expect(result.templates[0]).not.toHaveProperty("requiresManaged")
    expect(result).toEqual({
      templates: [
        {
          slug: "saas-starter",
          name: "SaaS Starter",
          description: "A repository description",
          owner: "deessejs",
          repo: "saas-template",
          license: "MIT",
          category: "saas",
          labels: ["nextjs", "saas", "auth"],
          image: "/ship-your-saas.png",
          cloneUrl: "https://github.com/deessejs/saas-template",
          updatedAt: "2026-01-02T03:04:05.000Z",
          stars: 42,
          sourceType: "github",
        },
      ],
    })
  })

  it("uses editorial overrides and allows an empty catalog", async () => {
    mockQuery([
      {
        ...templateRow,
        descriptionOverride: "Curated description",
        licenseFallback: "BSD-3-Clause",
      },
    ])

    const result = await call(appRouter.templates.list, undefined, { context })
    expect(result.templates[0]).toMatchObject({
      description: "Curated description",
      license: "BSD-3-Clause",
    })

    mockQuery([])
    await expect(
      call(appRouter.templates.list, undefined, { context })
    ).resolves.toEqual({ templates: [] })
  })

  it("lists a managed-only entry without a repository and marks it non-installable before its first release", async () => {
    mockQuery(
      [
        {
          ...templateRow,
          owner: null,
          repo: null,
          sourceType: "managed",
          canonicalUrl: null,
          repositoryDescription: null,
          license: null,
          stars: null,
          repositoryUpdatedAt: null,
        },
      ],
      []
    )
    const result = await call(appRouter.templates.list, undefined, { context })
    expect(result.templates[0]).toMatchObject({
      slug: "saas-starter",
      sourceType: "managed",
      requiresManaged: true,
      installable: false,
    })
    expect(result.templates[0]).not.toHaveProperty("owner")
    expect(result.templates[0]).not.toHaveProperty("repo")
    expect(result.templates[0]).not.toHaveProperty("cloneUrl")
  })
})

describe("templates.detail", () => {
  it("returns the requested official template including its README", async () => {
    mockQuery([templateRow])
    await expect(
      call(appRouter.templates.detail, { slug: "saas-starter" }, { context })
    ).resolves.toMatchObject({ slug: "saas-starter", readme: "# SaaS Starter" })
    expect(
      await call(
        appRouter.templates.detail,
        { slug: "saas-starter" },
        { context }
      )
    ).not.toHaveProperty("requiresManaged")
    expect(selectMock).toHaveBeenCalledWith(
      expect.objectContaining({ readme: expect.anything() })
    )
  })

  it("marks an entitled paid template as requiring managed resolution", async () => {
    mockQuery([{ ...templateRow, access: "paid" }])

    const result = await call(
      appRouter.templates.detail,
      { slug: "saas-starter" },
      {
        context: {
          ...context,
          user: { id: "member-1" },
          session: { activeOrganizationId: "org-1" },
        },
      }
    )

    expect(result).toMatchObject({ requiresManaged: true })
  })

  it("returns null for a missing official template", async () => {
    mockQuery([])
    await expect(
      call(appRouter.templates.detail, { slug: "missing" }, { context })
    ).resolves.toBeNull()
  })

  it("validates returned official details against the V1 contract", async () => {
    mockQuery([{ ...templateRow, slug: "" }])
    await expect(
      call(appRouter.templates.detail, { slug: "saas-starter" }, { context })
    ).rejects.toThrow()
  })
})

describe("templates.community public list and detail", () => {
  const publication = {
    organizationSlug: "acme",
    organizationName: "Acme",
    slug: "starter",
    name: "Starter",
    description: "A community starter",
    owner: "acme",
    repo: "starter",
    license: "MIT",
    category: "saas",
    labels: ["nextjs"],
    imageName: null,
    imageObjectId: null,
    canonicalUrl: "https://github.com/acme/starter",
    repositoryUpdatedAt: null,
    stars: null,
    sourceCommit: "0123456789abcdef0123456789abcdef01234567",
    readme: "# Starter",
  }

  it("maps public list rows without README and detail with README", async () => {
    mockQuery([publication])
    const list = await call(appRouter.templates.community.list, undefined, {
      context,
    })
    expect(list.templates[0]).toMatchObject({
      slug: "@acme/starter",
      community: true,
    })
    expect(list.templates[0]).not.toHaveProperty("readme")
    expect(selectMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ readme: expect.anything() })
    )
    mockQuery([publication])
    const detail = await call(
      appRouter.templates.community.detail,
      { organizationSlug: "acme", templateSlug: "starter" },
      { context }
    )
    expect(detail).toMatchObject({ slug: "@acme/starter", readme: "# Starter" })
  })

  it("does not return pending or unpublished rows", async () => {
    mockQuery([])
    await expect(
      call(
        appRouter.templates.community.detail,
        { organizationSlug: "acme", templateSlug: "hidden" },
        { context }
      )
    ).resolves.toBeNull()
    await expect(
      call(appRouter.templates.community.list, undefined, { context })
    ).resolves.toEqual({ templates: [] })
  })

  it("validates returned community details against the V1 contract", async () => {
    mockQuery([{ ...publication, sourceCommit: "not-a-commit" }])
    await expect(
      call(
        appRouter.templates.community.detail,
        { organizationSlug: "acme", templateSlug: "starter" },
        { context }
      )
    ).rejects.toThrow()
  })
})

describe("templates.resolve", () => {
  it("resolves the repository identity from a stored catalog row", async () => {
    mockQuery([templateRow])

    await expect(
      call(appRouter.templates.resolve, { slug: "saas-starter" }, { context })
    ).resolves.toEqual({
      slug: "saas-starter",
      owner: "deessejs",
      repo: "saas-template",
      sourceType: "github",
      requiresManaged: false,
    })
  })

  it("returns null for an unknown catalog slug", async () => {
    mockQuery([])

    await expect(
      call(appRouter.templates.resolve, { slug: "not-a-template" }, { context })
    ).resolves.toBeNull()
  })
})
