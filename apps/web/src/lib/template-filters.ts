/**
 * The `/templates` type and framework filters.
 *
 * The filter lives here rather than inline in the page so it can be
 * asserted on directly. The acceptance criterion for the catalogue is
 * that every category filter returns its matching rows, and a filter
 * that only exists inside an async server component cannot be tested
 * without rendering the whole page and mocking the API.
 *
 * The known slugs come from the canonical label maps, so the two axes
 * cannot drift apart from what the sidebar renders.
 */
import type { TemplateV1 } from "@workspace/contracts/v1"
import {
  CATEGORY_LABELS,
  FRAMEWORK_LABELS,
  type CategorySlug,
  type FrameworkSlug,
} from "@workspace/api/templates-labels"

const KNOWN_TYPES = Object.keys(CATEGORY_LABELS) as CategorySlug[]
const KNOWN_FRAMEWORKS = Object.keys(FRAMEWORK_LABELS) as FrameworkSlug[]

export type TemplateFilterParams = {
  type?: string | string[] | undefined
  framework?: string | string[] | undefined
}

export type TemplateFilter = {
  activeTypes: CategorySlug[]
  activeFrameworks: FrameworkSlug[]
}

const toArray = (value: string | string[] | undefined): string[] =>
  Array.isArray(value) ? value : value ? [value] : []

/**
 * Keep the values the filters know about, in order, without repeats.
 * An unknown value is dropped rather than matched against nothing.
 */
const dedupe = <T extends string>(
  values: ReadonlyArray<string>,
  allowed: ReadonlyArray<T>,
): T[] => {
  const set = new Set<T>(allowed)
  const out: T[] = []
  for (const value of values) {
    if (set.has(value as T)) {
      out.push(value as T)
    }
  }
  return Array.from(new Set(out))
}

/**
 * Read the filter out of the query string. The parameters are the ones
 * Next.js hands the page, where a repeated key arrives as an array.
 */
export const resolveTemplateFilter = (
  params: TemplateFilterParams,
): TemplateFilter => ({
  activeTypes: dedupe(toArray(params.type), KNOWN_TYPES),
  activeFrameworks: dedupe(toArray(params.framework), KNOWN_FRAMEWORKS),
})

/**
 * The rows the filter keeps. An empty axis matches everything, so a
 * page with no filter shows the whole catalogue.
 */
export const filterTemplates = (
  templates: ReadonlyArray<TemplateV1>,
  filter: TemplateFilter,
): TemplateV1[] => {
  const activeTypeSet = new Set<string>(filter.activeTypes)
  return templates.filter((template) => {
    const matchesType =
      filter.activeTypes.length === 0 || activeTypeSet.has(template.category)
    const matchesFramework =
      filter.activeFrameworks.length === 0 ||
      filter.activeFrameworks.some((framework) =>
        template.labels.includes(framework),
      )
    return matchesType && matchesFramework
  })
}
