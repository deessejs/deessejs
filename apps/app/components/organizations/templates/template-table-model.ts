export type TemplateTableRecord = {
  name: string
  slug: string
  owner: string | null
  repo: string | null
  repositoryName: string | null
  description: string
  canonicalUrl: string | null
  category: string
  labels: string[]
  sourceType: "github" | "managed"
  stars: number | null
  fetchedAt: string | null
  currentlyPublished: boolean
  publication: {
    reviewStatus: "pending" | "approved" | "rejected" | "withdrawn"
    publicationState: "unpublished" | "current" | "superseded" | "removed"
  } | null
}

export type TemplateStatusFilter =
  | "published"
  | "update-in-review"
  | "in-review"
  | "changes-requested"
  | "private"
  | "removed"
  | "previously-published"
  | "withdrawn"

export type TemplateSort =
  | "name-asc"
  | "name-desc"
  | "stars-desc"
  | "stars-asc"
  | "fetched-desc"
  | "fetched-asc"

export type TemplateFilters = {
  query: string
  category: string
  label: string
  status: TemplateStatusFilter | "all"
  source: TemplateTableRecord["sourceType"] | "all"
  sort: TemplateSort
}

export function getTemplateStatuses(
  template: TemplateTableRecord
): TemplateStatusFilter[] {
  const statuses: TemplateStatusFilter[] = []
  const publication = template.publication

  if (template.currentlyPublished) statuses.push("published")
  if (publication?.reviewStatus === "pending") {
    statuses.push(
      template.currentlyPublished ? "update-in-review" : "in-review"
    )
  } else if (publication?.reviewStatus === "rejected") {
    statuses.push("changes-requested")
  } else if (publication?.reviewStatus === "withdrawn") {
    statuses.push("withdrawn")
  } else if (
    !template.currentlyPublished &&
    publication?.reviewStatus === "approved" &&
    publication.publicationState === "superseded"
  ) {
    statuses.push("previously-published")
  } else if (
    !template.currentlyPublished &&
    publication?.publicationState === "removed"
  ) {
    statuses.push("removed")
  }

  if (statuses.length === 0) statuses.push("private")
  return statuses
}

export function filterAndSortTemplates<T extends TemplateTableRecord>(
  templates: T[],
  filters: TemplateFilters
): T[] {
  const needle = filters.query.trim().toLocaleLowerCase("en-US")
  const filtered = templates.filter((template) => {
    const searchText = [
      template.name,
      template.slug,
      template.owner,
      template.repo,
      template.repositoryName,
      template.canonicalUrl,
      template.description,
      ...template.labels,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("en-US")

    if (needle && !searchText.includes(needle)) return false
    if (filters.category !== "all" && template.category !== filters.category) {
      return false
    }
    if (filters.label !== "all" && !template.labels.includes(filters.label)) {
      return false
    }
    if (
      filters.status !== "all" &&
      !getTemplateStatuses(template).includes(filters.status)
    ) {
      return false
    }
    if (filters.source !== "all" && template.sourceType !== filters.source) {
      return false
    }
    return true
  })

  const direction = filters.sort.endsWith("desc") ? -1 : 1
  const sortedField = filters.sort.split("-")[0]
  return filtered.sort((left, right) => {
    if (sortedField === "name") {
      return (
        direction *
        left.name.localeCompare(right.name, "en", { sensitivity: "base" })
      )
    }

    const leftValue =
      sortedField === "stars"
        ? left.stars
        : left.fetchedAt
          ? Date.parse(left.fetchedAt)
          : null
    const rightValue =
      sortedField === "stars"
        ? right.stars
        : right.fetchedAt
          ? Date.parse(right.fetchedAt)
          : null

    if (leftValue === null) return rightValue === null ? 0 : 1
    if (rightValue === null) return -1
    return direction * (leftValue - rightValue)
  })
}
