/**
 * Contract tests for the public templates procedures.
 *
 * These tests exercise the route handlers without a network or database
 * connection and pin the projection from editorial and repository fields
 * onto the existing V1 wire shape.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

const { selectMock } = vi.hoisted(() => ({ selectMock: vi.fn() }))

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
}

const mockQuery = (rows: unknown[]) => {
  const query = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    orderBy: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  }
  query.from.mockReturnValue(query)
  query.innerJoin.mockReturnValue(query)
  query.orderBy.mockResolvedValue(rows)
  query.where.mockReturnValue(query)
  query.limit.mockResolvedValue(rows)
  selectMock.mockReturnValue(query)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("templates.list", () => {
  it("projects the database catalog into the declared V1 wire shape", async () => {
    mockQuery([templateRow])

    const result = await call(appRouter.templates.list, undefined, { context })

    expect(selectMock).toHaveBeenCalledWith(
      expect.objectContaining({ readme: expect.anything() })
    )
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
          readme: "# SaaS Starter",
          updatedAt: "2026-01-02T03:04:05.000Z",
          stars: 42,
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
})

describe("templates.detail", () => {
  it("returns the requested official template including its README", async () => {
    mockQuery([templateRow])
    await expect(
      call(appRouter.templates.detail, { slug: "saas-starter" }, { context })
    ).resolves.toMatchObject({ slug: "saas-starter", readme: "# SaaS Starter" })
    expect(selectMock).toHaveBeenCalledWith(
      expect.objectContaining({ readme: expect.anything() })
    )
  })

  it("returns null for a missing official template", async () => {
    mockQuery([])
    await expect(
      call(appRouter.templates.detail, { slug: "missing" }, { context })
    ).resolves.toBeNull()
  })
})

describe("templates.summary", () => {
  it("returns compact rows without README while preserving the V1 list payload", async () => {
    mockQuery([templateRow])
    const result = await call(appRouter.templates.summary, undefined, {
      context,
    })
    expect(result.templates[0]).not.toHaveProperty("readme")
    expect(result.templates[0].slug).toBe("saas-starter")
  })
})

describe("templates.community public summary and detail", () => {
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

  it("maps public summaries without README and detail with README", async () => {
    mockQuery([publication])
    const summary = await call(
      appRouter.templates.community.summary,
      undefined,
      { context }
    )
    expect(summary.templates[0]).toMatchObject({
      slug: "@acme/starter",
      community: true,
    })
    expect(summary.templates[0]).not.toHaveProperty("readme")
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
      call(appRouter.templates.community.summary, undefined, { context })
    ).resolves.toEqual({ templates: [] })
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
    })
  })

  it("returns null for an unknown catalog slug", async () => {
    mockQuery([])

    await expect(
      call(appRouter.templates.resolve, { slug: "not-a-template" }, { context })
    ).resolves.toBeNull()
  })
})
