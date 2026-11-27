"use client"

import Link from "next/link"
import { client } from "@/lib/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ORPCError } from "@orpc/client"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import {
  ArchiveXIcon,
  ArrowDownUpIcon,
  BoxesIcon,
  CalendarClockIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  Clock3Icon,
  EllipsisIcon,
  HistoryIcon,
  LockKeyholeIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  Undo2Icon,
  XIcon,
} from "lucide-react"
import type { RouterClient } from "@orpc/server"
import type { appRouter } from "@workspace/api/router"
import { CreateOrganizationTemplateDialog } from "./create-organization-template-dialog"
import { RequestTemplatePublicationDialog } from "./request-template-publication-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  filterAndSortTemplates,
  getTemplateStatuses,
  type TemplateFilters,
  type TemplateSort,
  type TemplateStatusFilter,
} from "./template-table-model"

type OrganizationTemplate = Awaited<
  ReturnType<
    RouterClient<typeof appRouter>["organization"]["templates"]["list"]
  >
>["templates"][number]

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

export function OrganizationTemplatesPage({
  organizationSlug,
  organizationName,
  canManage,
  templates,
  fetchError,
}: {
  organizationSlug: string
  organizationName: string
  canManage: boolean
  templates: OrganizationTemplate[]
  fetchError: string | null
}) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [publicationDialogOpen, setPublicationDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] =
    useState<OrganizationTemplate | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function withdrawPublication(templateId: string) {
    setActionError(null)
    try {
      await client.rpc.organization.templates.withdraw({
        organizationSlug,
        templateId,
      })
      router.refresh()
    } catch (error) {
      setActionError(
        error instanceof ORPCError
          ? "The request is no longer pending. Refresh and try again."
          : "The request could not be withdrawn. Try again."
      )
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <TemplatesHeader
        organizationName={organizationName}
        canManage={canManage}
        onAdd={() => setDialogOpen(true)}
      />
      <TemplateContent
        templates={templates}
        organizationName={organizationName}
        canManage={canManage}
        fetchError={fetchError}
        onAdd={() => setDialogOpen(true)}
        onRequestPublication={(template) => {
          setSelectedTemplate(template)
          setPublicationDialogOpen(true)
        }}
        onWithdrawPublication={(templateId) =>
          void withdrawPublication(templateId)
        }
        actionError={actionError}
      />
      {canManage && (
        <CreateOrganizationTemplateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          organizationSlug={organizationSlug}
          onCreated={() => router.refresh()}
        />
      )}
      {canManage && selectedTemplate ? (
        <RequestTemplatePublicationDialog
          open={publicationDialogOpen}
          onOpenChange={setPublicationDialogOpen}
          organizationSlug={organizationSlug}
          template={selectedTemplate}
          onSubmitted={() => router.refresh()}
        />
      ) : null}
    </div>
  )
}

function TemplatesHeader({
  organizationName,
  canManage,
  onAdd,
}: {
  organizationName: string
  canManage: boolean
  onAdd: () => void
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Private templates for {organizationName}. Only members of this
          organization can see them.
        </p>
      </div>
      {canManage && (
        <Button onClick={onAdd}>
          <PlusIcon aria-hidden />
          Add template
        </Button>
      )}
    </header>
  )
}

function TemplateContent({
  templates,
  organizationName,
  canManage,
  fetchError,
  onAdd,
  onRequestPublication,
  onWithdrawPublication,
  actionError,
}: {
  templates: OrganizationTemplate[]
  organizationName: string
  canManage: boolean
  fetchError: string | null
  onAdd: () => void
  onRequestPublication: (template: OrganizationTemplate) => void
  onWithdrawPublication: (templateId: string) => void
  actionError: string | null
}) {
  if (fetchError) {
    return (
      <p
        className="rounded-md border border-destructive/30 p-4 text-sm text-destructive"
        role="alert"
      >
        {fetchError}
      </p>
    )
  }

  if (templates.length === 0) {
    return <EmptyTemplates canManage={canManage} onAdd={onAdd} />
  }

  return (
    <OrganizationTemplateTable
      templates={templates}
      organizationName={organizationName}
      canManage={canManage}
      onRequestPublication={onRequestPublication}
      onWithdrawPublication={onWithdrawPublication}
      actionError={actionError}
    />
  )
}

function EmptyTemplates({
  canManage,
  onAdd,
}: {
  canManage: boolean
  onAdd: () => void
}) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
      <h2 className="text-lg font-semibold">No templates yet</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {canManage
          ? "Add a public GitHub repository to create the first private template for this organization."
          : "An organization owner or admin can add the first private template."}
      </p>
      {canManage && (
        <Button onClick={onAdd}>
          <PlusIcon aria-hidden />
          Add your first template
        </Button>
      )}
    </section>
  )
}

function OrganizationTemplateTable({
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
  const sortedTemplates = filterAndSortTemplates(templates, filters)
  const categories = [
    ...new Set(templates.map((template) => template.category)),
  ].sort()
  const labels = [
    ...new Set(templates.flatMap((template) => template.labels)),
  ].sort()
  const statuses = [...new Set(templates.flatMap(getTemplateStatuses))]
  const activeFilters =
    Number(filters.query.trim().length > 0) +
    Number(filters.category !== "all") +
    Number(filters.label !== "all") +
    Number(filters.status !== "all") +
    Number(filters.source !== "all")
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

      <section
        aria-label="Filter organization templates"
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <InputGroup className="min-w-0 flex-1">
            <InputGroupAddon>
              <SearchIcon aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Search organization templates"
              placeholder="Search name, slug, repository, owner, or label"
              value={filters.query}
              onChange={(event) => setFilter("query", event.target.value)}
            />
          </InputGroup>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilter(
                  "status",
                  (value ?? "all") as TemplateFilters["status"]
                )
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
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(value) => setFilter("category", value ?? "all")}
            >
              <SelectTrigger
                className="w-full sm:w-40"
                aria-label="Filter by category"
              >
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {categoryLabels[category] ?? formatCategory(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.label}
              onValueChange={(value) => setFilter("label", value ?? "all")}
            >
              <SelectTrigger
                className="w-full sm:w-40"
                aria-label="Filter by label"
              >
                <SelectValue placeholder="All labels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All labels</SelectItem>
                {labels.map((label) => (
                  <SelectItem key={label} value={label}>
                    {formatLabel(label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.source}
              onValueChange={(value) =>
                setFilter(
                  "source",
                  (value ?? "all") as TemplateFilters["source"]
                )
              }
            >
              <SelectTrigger
                className="w-full sm:w-36"
                aria-label="Filter by source"
              >
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {templates.some(
                  (template) => template.sourceType === "github"
                ) ? (
                  <SelectItem value="github">GitHub</SelectItem>
                ) : null}
                {templates.some(
                  (template) => template.sourceType === "managed"
                ) ? (
                  <SelectItem value="managed">Managed</SelectItem>
                ) : null}
              </SelectContent>
            </Select>

            <Select
              value={filters.sort}
              onValueChange={(value) =>
                setFilter("sort", (value ?? "name-asc") as TemplateSort)
              }
            >
              <SelectTrigger
                className="w-full sm:w-44"
                aria-label="Sort templates"
              >
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
          </div>
        </div>

        <div className="flex min-h-8 flex-wrap items-center gap-2">
          <p
            className="mr-auto text-sm text-muted-foreground"
            aria-live="polite"
          >
            Showing{" "}
            <span className="font-medium text-foreground">
              {sortedTemplates.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {templates.length}
            </span>{" "}
            templates
          </p>
          {filters.query.trim() ? (
            <ActiveFilter
              label={`Search: ${filters.query.trim()}`}
              onRemove={() => setFilter("query", "")}
            />
          ) : null}
          {filters.category !== "all" ? (
            <ActiveFilter
              label={`Category: ${categoryLabels[filters.category] ?? formatCategory(filters.category)}`}
              onRemove={() => setFilter("category", "all")}
            />
          ) : null}
          {filters.label !== "all" ? (
            <ActiveFilter
              label={`Label: ${formatLabel(filters.label)}`}
              onRemove={() => setFilter("label", "all")}
            />
          ) : null}
          {filters.status !== "all" ? (
            <ActiveFilter
              label={`Status: ${statusLabels[filters.status]}`}
              onRemove={() => setFilter("status", "all")}
            />
          ) : null}
          {filters.source !== "all" ? (
            <ActiveFilter
              label={`Source: ${filters.source === "github" ? "GitHub" : "Managed"}`}
              onRemove={() => setFilter("source", "all")}
            />
          ) : null}
          {activeFilters > 0 ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <XIcon aria-hidden />
              Clear filters
            </Button>
          ) : null}
        </div>
      </section>

      {sortedTemplates.length === 0 ? (
        <section
          className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-14 text-center"
          role="status"
        >
          <SearchIcon className="size-5 text-muted-foreground" aria-hidden />
          <h2 className="font-medium">No templates match these filters</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Try a different search or remove a filter to see more templates.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </section>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="w-full min-w-[960px] caption-bottom text-sm">
              <caption className="sr-only">
                Templates owned by {organizationName}
              </caption>
              <thead className="border-b bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th scope="col" className="h-11 w-48 px-4 font-medium">
                    Publication status
                  </th>
                  <th scope="col" className="h-11 min-w-80 px-4 font-medium">
                    Template
                  </th>
                  <th scope="col" className="h-11 min-w-64 px-4 font-medium">
                    Category and labels
                  </th>
                  <th
                    scope="col"
                    className="h-11 w-24 px-4 text-right font-medium"
                  >
                    Stars
                  </th>
                  <th
                    scope="col"
                    className="h-11 w-20 px-4 text-right font-medium"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedTemplates.map((template) => (
                  <tr key={template.id} className="align-middle">
                    <td className="px-4 py-4">
                      <TemplateStatus template={template} />
                    </td>
                    <td className="max-w-lg px-4 py-3">
                      <TemplateIdentity template={template} />
                    </td>
                    <td className="px-4 py-3">
                      <TemplateClassification template={template} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="inline-flex items-center justify-end gap-1.5 text-muted-foreground">
                        <StarIcon className="size-3.5" aria-hidden />
                        {template.stars?.toLocaleString("en-US") ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <TemplateActions
                        template={template}
                        canManage={canManage}
                        onRequest={() => onRequestPublication(template)}
                        onWithdraw={() => onWithdrawPublication(template.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {sortedTemplates.map((template) => (
              <article
                key={template.id}
                className="rounded-lg border bg-card p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <TemplateStatus template={template} />
                  <TemplateActions
                    template={template}
                    canManage={canManage}
                    onRequest={() => onRequestPublication(template)}
                    onWithdraw={() => onWithdrawPublication(template.id)}
                  />
                </div>
                <TemplateIdentity template={template} />
                <div className="mt-3">
                  <TemplateClassification template={template} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <StarIcon className="size-3.5" aria-hidden />
                    {template.stars?.toLocaleString("en-US") ?? "No star data"}
                  </span>
                  <span>
                    {template.fetchedAt
                      ? `Fetched ${dateFormatter.format(new Date(template.fetchedAt))}`
                      : "Not fetched yet"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ActiveFilter({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
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

function TemplateIdentity({ template }: { template: OrganizationTemplate }) {
  const imageUrl = template.previewImageUrl ?? template.imageUrl
  const repository =
    template.sourceType === "managed"
      ? "Managed archive"
      : [template.owner, template.repo].filter(Boolean).join("/")

  return (
    <div className="flex min-w-0 items-start gap-3">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          width={48}
          height={48}
          sizes="48px"
          unoptimized
          className="size-12 shrink-0 rounded-md border bg-muted object-cover"
        />
      ) : (
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground"
          aria-hidden
        >
          <BoxesIcon className="size-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {template.canonicalUrl ? (
          <Link
            className="block truncate font-medium underline-offset-4 hover:underline focus-visible:underline"
            href={template.canonicalUrl}
            target="_blank"
            rel="noreferrer"
          >
            {template.name}
          </Link>
        ) : (
          <p className="truncate font-medium">{template.name}</p>
        )}
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          <span className="font-mono">{template.slug}</span>
          {repository ? <span> · {repository}</span> : null}
          {template.sourceType === "managed" && !template.installable ? (
            <span> · First release not published</span>
          ) : null}
        </p>
        {template.fetchedAt ? (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClockIcon className="size-3 shrink-0" aria-hidden />
            <time dateTime={template.fetchedAt}>
              Last fetched {dateFormatter.format(new Date(template.fetchedAt))}
            </time>
          </p>
        ) : null}
      </div>
    </div>
  )
}

function TemplateClassification({
  template,
}: {
  template: OrganizationTemplate
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge
        variant="outline"
        className={categoryStyles[template.category] ?? categoryStyles.default}
      >
        {categoryLabels[template.category] ?? formatCategory(template.category)}
      </Badge>
      {template.labels.slice(0, 4).map((label) => (
        <Badge
          key={label}
          variant="outline"
          title={formatLabel(label)}
          className={labelStyle(label)}
        >
          {formatLabel(label)}
        </Badge>
      ))}
      {template.labels.length > 4 ? (
        <span
          className="text-xs text-muted-foreground"
          title={template.labels.slice(4).map(formatLabel).join(", ")}
        >
          +{template.labels.length - 4} more
        </span>
      ) : null}
    </div>
  )
}

function TemplateStatus({ template }: { template: OrganizationTemplate }) {
  const statuses = getTemplateStatuses(template)
  const primary = statuses.includes("published")
    ? "published"
    : (statuses[0] ?? "private")
  const secondary = statuses.filter((status) => status !== primary)

  return (
    <div className="flex min-w-36 flex-col items-start gap-1.5">
      <StatusBadge status={primary} />
      {secondary.map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
      {template.publication?.reviewStatus === "rejected" &&
      template.publication.reviewReason ? (
        <p
          className="max-w-48 truncate text-xs text-muted-foreground"
          title={template.publication.reviewReason}
        >
          {template.publication.reviewReason}
        </p>
      ) : null}
    </div>
  )
}

function StatusBadge({ status }: { status: TemplateStatusFilter }) {
  const config = statusConfig[status]
  const Icon = config.icon
  return (
    <Badge
      variant="outline"
      title={config.label}
      className={`gap-1.5 ${config.className}`}
    >
      <Icon className="size-3.5" aria-hidden />
      {config.label}
    </Badge>
  )
}

function TemplateActions({
  template,
  canManage,
  onRequest,
  onWithdraw,
}: {
  template: OrganizationTemplate
  canManage: boolean
  onRequest: () => void
  onWithdraw: () => void
}) {
  if (!canManage) {
    return <span className="sr-only">No management actions available</span>
  }

  const isPending = template.publication?.reviewStatus === "pending"
  const actionLabel = isPending
    ? "Withdraw publication request"
    : template.currentlyPublished
      ? "Submit template update"
      : "Request template publication"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${template.name}`}
          className="size-9"
        >
          <EllipsisIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="max-w-56 truncate">
          {template.name}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={isPending ? onWithdraw : onRequest}
          className={isPending ? "text-destructive focus:text-destructive" : ""}
        >
          {isPending ? (
            <Undo2Icon aria-hidden />
          ) : template.currentlyPublished ? (
            <HistoryIcon aria-hidden />
          ) : (
            <CircleCheckIcon aria-hidden />
          )}
          {actionLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function formatCategory(category: string) {
  return category
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatLabel(label: string) {
  const knownLabels: Record<string, string> = {
    nextjs: "Next.js",
    "react-hook-form": "React Hook Form",
    "tanstack-table": "TanStack Table",
    shadcn: "shadcn/ui",
    ai: "AI",
    saas: "SaaS",
    api: "API",
    css: "CSS",
    html: "HTML",
    mdx: "MDX",
    mcp: "MCP",
    npm: "npm",
    orpc: "oRPC",
    sdk: "SDK",
    seo: "SEO",
    ui: "UI",
  }
  return (
    knownLabels[label.toLowerCase()] ??
    label
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  )
}

const categoryLabels: Record<string, string> = {
  saas: "SaaS",
  ai: "AI",
  landing: "Landing pages",
  desktop: "Desktop apps",
  docs: "Documentation",
  marketing: "Marketing",
  content: "Content",
  library: "Libraries",
  "ai-agent": "AI agents",
}

const categoryStyles: Record<string, string> = {
  default: "border-border bg-muted text-foreground",
  saas: "border-blue-500/20 bg-blue-500/10 text-blue-800 dark:text-blue-200",
  ai: "border-violet-500/20 bg-violet-500/10 text-violet-800 dark:text-violet-200",
  landing:
    "border-orange-500/20 bg-orange-500/10 text-orange-800 dark:text-orange-200",
  desktop: "border-cyan-500/20 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200",
  docs: "border-indigo-500/20 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200",
  marketing:
    "border-pink-500/20 bg-pink-500/10 text-pink-800 dark:text-pink-200",
  content:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  library:
    "border-slate-500/20 bg-slate-500/10 text-slate-800 dark:text-slate-200",
  "ai-agent":
    "border-purple-500/20 bg-purple-500/10 text-purple-800 dark:text-purple-200",
}

const labelPalettes = [
  "border-blue-500/20 bg-blue-500/5 text-blue-800 dark:text-blue-200",
  "border-violet-500/20 bg-violet-500/5 text-violet-800 dark:text-violet-200",
  "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200",
  "border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-200",
  "border-rose-500/20 bg-rose-500/5 text-rose-800 dark:text-rose-200",
  "border-cyan-500/20 bg-cyan-500/5 text-cyan-800 dark:text-cyan-200",
]

function labelStyle(label: string) {
  let hash = 0
  for (const character of label.toLowerCase()) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }
  return labelPalettes[hash % labelPalettes.length]
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

const statusConfig: Record<
  TemplateStatusFilter,
  { label: string; icon: typeof CircleCheckIcon; className: string }
> = {
  published: {
    label: statusLabels.published,
    icon: CircleCheckIcon,
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  },
  "update-in-review": {
    label: statusLabels["update-in-review"],
    icon: Clock3Icon,
    className:
      "border-blue-500/20 bg-blue-500/10 text-blue-800 dark:text-blue-200",
  },
  "in-review": {
    label: statusLabels["in-review"],
    icon: Clock3Icon,
    className:
      "border-blue-500/20 bg-blue-500/10 text-blue-800 dark:text-blue-200",
  },
  "changes-requested": {
    label: statusLabels["changes-requested"],
    icon: CircleAlertIcon,
    className:
      "border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  },
  private: {
    label: statusLabels.private,
    icon: LockKeyholeIcon,
    className: "border-border bg-muted text-foreground",
  },
  removed: {
    label: statusLabels.removed,
    icon: ArchiveXIcon,
    className: "border-border bg-muted text-muted-foreground",
  },
  "previously-published": {
    label: statusLabels["previously-published"],
    icon: HistoryIcon,
    className: "border-border bg-muted text-muted-foreground",
  },
  withdrawn: {
    label: statusLabels.withdrawn,
    icon: Undo2Icon,
    className: "border-border bg-muted text-muted-foreground",
  },
}
