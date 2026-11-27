import { describe, expect, it } from "vitest"
import {
  filterAndSortTemplates,
  getTemplateStatuses,
  type TemplateFilters,
  type TemplateTableRecord,
} from "../components/organizations/templates/template-table-model"

function template(
  overrides: Partial<TemplateTableRecord> = {}
): TemplateTableRecord {
  return {
    name: "SaaS Starter",
    slug: "saas-starter",
    owner: "deessejs",
    repo: "saas-starter",
    repositoryName: "deessejs/saas-starter",
    description: "A starter kit",
    canonicalUrl: "https://github.com/deessejs/saas-starter",
    category: "saas",
    labels: ["nextjs", "postgres"],
    sourceType: "github",
    stars: 100,
    fetchedAt: "2026-11-20T10:00:00.000Z",
    currentlyPublished: false,
    publication: null,
    ...overrides,
  }
}

const defaultFilters: TemplateFilters = {
  query: "",
  category: "all",
  label: "all",
  status: "all",
  source: "all",
  sort: "name-asc",
}

describe("organization template table model", () => {
  it("keeps the live publication visible while an update is under review", () => {
    expect(
      getTemplateStatuses(
        template({
          currentlyPublished: true,
          publication: {
            reviewStatus: "pending",
            publicationState: "current",
          },
        })
      )
    ).toEqual(["published", "update-in-review"])
  })

  it("derives removed, withdrawn, and previously published states from real publication fields", () => {
    expect(
      getTemplateStatuses(
        template({
          publication: {
            reviewStatus: "approved",
            publicationState: "removed",
          },
        })
      )
    ).toEqual(["removed"])
    expect(
      getTemplateStatuses(
        template({
          publication: {
            reviewStatus: "withdrawn",
            publicationState: "unpublished",
          },
        })
      )
    ).toEqual(["withdrawn"])
    expect(
      getTemplateStatuses(
        template({
          publication: {
            reviewStatus: "approved",
            publicationState: "superseded",
          },
        })
      )
    ).toEqual(["previously-published"])
  })

  it("searches case-insensitively across repository, owner, and labels", () => {
    const records = [
      template(),
      template({
        name: "Docs",
        slug: "docs",
        category: "docs",
        labels: ["mdx"],
        owner: "docs-org",
        repo: "docs-site",
        repositoryName: "docs-org/docs-site",
        canonicalUrl: "https://github.com/docs-org/docs-site",
      }),
    ]

    expect(
      filterAndSortTemplates(records, {
        ...defaultFilters,
        query: "DEESSEJS/SAAS",
      })
    ).toEqual([records[0]])
    expect(
      filterAndSortTemplates(records, { ...defaultFilters, query: "POSTGRES" })
    ).toEqual([records[0]])
  })

  it("intersects category, label, publication status, and source filters", () => {
    const records = [
      template({
        currentlyPublished: true,
        publication: { reviewStatus: "pending", publicationState: "current" },
      }),
      template({
        name: "Managed Docs",
        category: "docs",
        labels: ["mdx"],
        sourceType: "managed",
      }),
    ]

    expect(
      filterAndSortTemplates(records, {
        ...defaultFilters,
        category: "saas",
        label: "postgres",
        status: "update-in-review",
        source: "github",
      })
    ).toEqual([records[0]])
  })

  it("sorts stars and fetch dates while keeping missing values last", () => {
    const records = [
      template({ name: "No metadata", stars: null, fetchedAt: null }),
      template({
        name: "Older",
        stars: 5,
        fetchedAt: "2026-11-01T10:00:00.000Z",
      }),
      template({
        name: "Newer",
        stars: 50,
        fetchedAt: "2026-11-25T10:00:00.000Z",
      }),
    ]

    expect(
      filterAndSortTemplates(records, {
        ...defaultFilters,
        sort: "stars-desc",
      }).map((item) => item.name)
    ).toEqual(["Newer", "Older", "No metadata"])
    expect(
      filterAndSortTemplates(records, {
        ...defaultFilters,
        sort: "fetched-desc",
      }).map((item) => item.name)
    ).toEqual(["Newer", "Older", "No metadata"])
  })
})
