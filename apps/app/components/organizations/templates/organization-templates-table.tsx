"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { XIcon } from "lucide-react"
import {
  filterAndSortTemplates,
  getTemplateStatuses,
  type OrganizationTemplate,
  type TemplateFilters,
} from "./template-table-model"
import { OrganizationTemplatesTableFilters } from "./organization-templates-table-filters"
import { OrganizationTemplatesTableResults } from "./organization-templates-table-results"

export function OrganizationTemplatesTable({
  templates,
  organizationName,
  canManage,
  onRequestPublication,
  onWithdrawPublication,
  actionError,
}: {
  templates: OrganizationTemplate[]
  organizationName: string
  canManage: boolean
  onRequestPublication: (template: OrganizationTemplate) => void
  onWithdrawPublication: (templateId: string) => void
  actionError: string | null
}) {
  const [filters, setFilters] = useState<TemplateFilters>({
    query: "",
    category: "all",
    label: "all",
    status: "all",
    source: "all",
    sort: "name-asc",
  })
  const filteredTemplates = filterAndSortTemplates(templates, filters)
  const categories = uniqueSorted(
    templates.map((template) => template.category)
  )
  const labels = uniqueSorted(templates.flatMap((template) => template.labels))
  const statuses = [...new Set(templates.flatMap(getTemplateStatuses))]
  const activeFilterCount = countActiveFilters(filters)
  const setFilter = <K extends keyof TemplateFilters>(
    key: K,
    value: TemplateFilters[K]
  ) => setFilters((current) => ({ ...current, [key]: value }))
  const clearFilters = () =>
    setFilters((current) => ({
      ...current,
      query: "",
      category: "all",
      label: "all",
      status: "all",
      source: "all",
    }))

  return (
    <div className="flex flex-col gap-4">
      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}
      <OrganizationTemplatesTableFilters
        filters={filters}
        categories={categories}
        labels={labels}
        statuses={statuses}
        hasGitHubSource={templates.some(
          (template) => template.sourceType === "github"
        )}
        hasManagedSource={templates.some(
          (template) => template.sourceType === "managed"
        )}
        filteredCount={filteredTemplates.length}
        totalCount={templates.length}
        activeFilterCount={activeFilterCount}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
      />
      {filteredTemplates.length === 0 ? (
        <section
          className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-14 text-center"
          role="status"
        >
          <h2 className="font-medium">No templates match these filters</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Try a different search or remove a filter to see more templates.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            <XIcon aria-hidden />
            Clear filters
          </Button>
        </section>
      ) : (
        <OrganizationTemplatesTableResults
          templates={filteredTemplates}
          organizationName={organizationName}
          canManage={canManage}
          onRequestPublication={onRequestPublication}
          onWithdrawPublication={onWithdrawPublication}
        />
      )}
    </div>
  )
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort()
}

function countActiveFilters(filters: TemplateFilters) {
  return (
    Number(filters.query.trim().length > 0) +
    Number(filters.category !== "all") +
    Number(filters.label !== "all") +
    Number(filters.status !== "all") +
    Number(filters.source !== "all")
  )
}

export type TemplateFilterChange = <K extends keyof TemplateFilters>(
  key: K,
  value: TemplateFilters[K]
) => void
