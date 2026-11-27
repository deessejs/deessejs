import { Button } from "@workspace/ui/components/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { ArrowDownUpIcon, SearchIcon, XIcon } from "lucide-react"
import {
  type TemplateFilters,
  type TemplateSort,
  type TemplateStatusFilter,
} from "./template-table-model"
import { formatCategory, formatLabel } from "./template-table-format"
import type { TemplateFilterChange } from "./organization-templates-table"

export function OrganizationTemplatesTableFilters({
  filters,
  categories,
  labels,
  statuses,
  hasGitHubSource,
  hasManagedSource,
  filteredCount,
  totalCount,
  activeFilterCount,
  onFilterChange,
  onClearFilters,
}: {
  filters: TemplateFilters
  categories: string[]
  labels: string[]
  statuses: TemplateStatusFilter[]
  hasGitHubSource: boolean
  hasManagedSource: boolean
  filteredCount: number
  totalCount: number
  activeFilterCount: number
  onFilterChange: TemplateFilterChange
  onClearFilters: () => void
}) {
  return (
    <section
      aria-label="Filter organization templates"
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <TemplateSearchFilter
          value={filters.query}
          onChange={(value) => onFilterChange("query", value)}
        />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <StatusFilter
            value={filters.status}
            options={statuses}
            onChange={(value) => onFilterChange("status", value)}
          />
          <CategoryFilter
            value={filters.category}
            options={categories}
            onChange={(value) => onFilterChange("category", value)}
          />
          <LabelFilter
            value={filters.label}
            options={labels}
            onChange={(value) => onFilterChange("label", value)}
          />
          <SourceFilter
            value={filters.source}
            hasGitHubSource={hasGitHubSource}
            hasManagedSource={hasManagedSource}
            onChange={(value) => onFilterChange("source", value)}
          />
          <SortFilter
            value={filters.sort}
            onChange={(value) => onFilterChange("sort", value)}
          />
        </div>
      </div>
      <ActiveFilterSummary
        filters={filters}
        filteredCount={filteredCount}
        totalCount={totalCount}
        activeFilterCount={activeFilterCount}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
      />
    </section>
  )
}

function TemplateSearchFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <InputGroup className="min-w-0 flex-1">
      <InputGroupAddon>
        <SearchIcon aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        aria-label="Search organization templates"
        placeholder="Search name, slug, repository, owner, or label"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </InputGroup>
  )
}

function StatusFilter({
  value,
  options,
  onChange,
}: {
  value: TemplateFilters["status"]
  options: TemplateStatusFilter[]
  onChange: (value: TemplateFilters["status"]) => void
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) =>
        onChange((nextValue ?? "all") as TemplateFilters["status"])
      }
    >
      <SelectTrigger
        className="w-full sm:w-48"
        aria-label="Filter by publication status"
      >
        <SelectValue placeholder="Any status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Any status</SelectItem>
        {options.map((status) => (
          <SelectItem key={status} value={status}>
            {statusLabels[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function CategoryFilter({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onChange(nextValue ?? "all")}
    >
      <SelectTrigger className="w-full sm:w-40" aria-label="Filter by category">
        <SelectValue placeholder="All categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All categories</SelectItem>
        {options.map((category) => (
          <SelectItem key={category} value={category}>
            {formatCategory(category)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function LabelFilter({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onChange(nextValue ?? "all")}
    >
      <SelectTrigger className="w-full sm:w-40" aria-label="Filter by label">
        <SelectValue placeholder="All labels" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All labels</SelectItem>
        {options.map((label) => (
          <SelectItem key={label} value={label}>
            {formatLabel(label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function SourceFilter({
  value,
  hasGitHubSource,
  hasManagedSource,
  onChange,
}: {
  value: TemplateFilters["source"]
  hasGitHubSource: boolean
  hasManagedSource: boolean
  onChange: (value: TemplateFilters["source"]) => void
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) =>
        onChange((nextValue ?? "all") as TemplateFilters["source"])
      }
    >
      <SelectTrigger className="w-full sm:w-36" aria-label="Filter by source">
        <SelectValue placeholder="All sources" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All sources</SelectItem>
        {hasGitHubSource ? (
          <SelectItem value="github">GitHub</SelectItem>
        ) : null}
        {hasManagedSource ? (
          <SelectItem value="managed">Managed</SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  )
}

function SortFilter({
  value,
  onChange,
}: {
  value: TemplateSort
  onChange: (value: TemplateSort) => void
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) =>
        onChange((nextValue ?? "name-asc") as TemplateSort)
      }
    >
      <SelectTrigger className="w-full sm:w-44" aria-label="Sort templates">
        <ArrowDownUpIcon aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="name-asc">Name, A to Z</SelectItem>
        <SelectItem value="name-desc">Name, Z to A</SelectItem>
        <SelectItem value="stars-desc">Most stars</SelectItem>
        <SelectItem value="stars-asc">Fewest stars</SelectItem>
        <SelectItem value="fetched-desc">Recently fetched</SelectItem>
        <SelectItem value="fetched-asc">Oldest fetch</SelectItem>
      </SelectContent>
    </Select>
  )
}

function ActiveFilterSummary({
  filters,
  filteredCount,
  totalCount,
  activeFilterCount,
  onFilterChange,
  onClearFilters,
}: {
  filters: TemplateFilters
  filteredCount: number
  totalCount: number
  activeFilterCount: number
  onFilterChange: TemplateFilterChange
  onClearFilters: () => void
}) {
  return (
    <div className="flex min-h-8 flex-wrap items-center gap-2">
      <p className="mr-auto text-sm text-muted-foreground" aria-live="polite">
        Showing{" "}
        <span className="font-medium text-foreground">{filteredCount}</span> of{" "}
        <span className="font-medium text-foreground">{totalCount}</span>{" "}
        templates
      </p>
      <ActiveFilter
        label={filters.query.trim() ? `Search: ${filters.query.trim()}` : null}
        onRemove={() => onFilterChange("query", "")}
      />
      <ActiveFilter
        label={
          filters.category !== "all"
            ? `Category: ${formatCategory(filters.category)}`
            : null
        }
        onRemove={() => onFilterChange("category", "all")}
      />
      <ActiveFilter
        label={
          filters.label !== "all"
            ? `Label: ${formatLabel(filters.label)}`
            : null
        }
        onRemove={() => onFilterChange("label", "all")}
      />
      <ActiveFilter
        label={
          filters.status !== "all"
            ? `Status: ${statusLabels[filters.status]}`
            : null
        }
        onRemove={() => onFilterChange("status", "all")}
      />
      <ActiveFilter
        label={
          filters.source !== "all"
            ? `Source: ${filters.source === "github" ? "GitHub" : "Managed"}`
            : null
        }
        onRemove={() => onFilterChange("source", "all")}
      />
      {activeFilterCount > 0 ? (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <XIcon aria-hidden />
          Clear filters
        </Button>
      ) : null}
    </div>
  )
}

function ActiveFilter({
  label,
  onRemove,
}: {
  label: string | null
  onRemove: () => void
}) {
  if (!label) return null
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 max-w-full gap-1.5 rounded-full px-2 text-xs"
      onClick={onRemove}
      aria-label={`Remove filter: ${label}`}
    >
      <span className="truncate">{label}</span>
      <XIcon className="size-3 shrink-0" aria-hidden />
    </Button>
  )
}

const statusLabels: Record<TemplateStatusFilter, string> = {
  published: "Published",
  "update-in-review": "Update in review",
  "in-review": "Awaiting review",
  "changes-requested": "Changes requested",
  private: "Private",
  removed: "Removed from catalog",
  "previously-published": "Previously published",
  withdrawn: "Withdrawn",
}
