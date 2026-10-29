"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ORPCError } from "@orpc/client"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { PlusIcon, SearchIcon } from "lucide-react"
import type { RouterClient } from "@orpc/server"
import type { appRouter } from "@workspace/api/router"
import { CreateOrganizationTemplateDialog } from "./create-organization-template-dialog"
import { RequestTemplatePublicationDialog } from "./request-template-publication-dialog"
import { orpcBrowser } from "@/lib/orpc-browser"

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
      await orpcBrowser.organization.templates.withdraw({
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
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
  const [query, setQuery] = useState("")
  const needle = query.trim().toLocaleLowerCase()
  const filtered = needle
    ? templates.filter((template) =>
        [template.name, template.slug, template.owner, template.repo]
          .join(" ")
          .toLocaleLowerCase()
          .includes(needle)
      )
    : templates

  return (
    <div className="flex flex-col gap-3">
      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <InputGroup className="w-full sm:max-w-sm">
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search organization templates"
            placeholder="Search templates"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
        <p className="text-sm text-muted-foreground">
          {templates.length} {templates.length === 1 ? "template" : "templates"}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border px-6 py-12 text-center text-sm text-muted-foreground">
          No templates match your search.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full caption-bottom text-sm">
            <caption className="sr-only">
              Templates owned by {organizationName}
            </caption>
            <thead className="border-b bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th scope="col" className="h-11 px-4 font-medium">
                  Template
                </th>
                <th scope="col" className="h-11 px-4 font-medium">
                  Category
                </th>
                <th scope="col" className="h-11 px-4 font-medium">
                  Labels
                </th>
                <th scope="col" className="h-11 px-4 font-medium">
                  Stars
                </th>
                <th scope="col" className="h-11 px-4 font-medium">
                  Last fetched
                </th>
                <th scope="col" className="h-11 px-4 font-medium">
                  Community publication
                </th>
              </tr>
            </thead>
            <TemplateRows
              templates={filtered}
              canManage={canManage}
              onRequestPublication={onRequestPublication}
              onWithdrawPublication={onWithdrawPublication}
            />
          </table>
        </div>
      )}
    </div>
  )
}

function TemplateRows({
  templates,
  canManage,
  onRequestPublication,
  onWithdrawPublication,
}: {
  templates: OrganizationTemplate[]
  canManage: boolean
  onRequestPublication: (template: OrganizationTemplate) => void
  onWithdrawPublication: (templateId: string) => void
}) {
  return (
    <tbody className="divide-y">
      {templates.map((template) => (
        <tr key={template.id}>
          <td className="max-w-sm px-4 py-3">
            <a
              className="font-medium underline-offset-4 hover:underline"
              href={template.canonicalUrl}
              target="_blank"
              rel="noreferrer"
            >
              {template.name}
            </a>
            <div className="mt-1 truncate text-xs text-muted-foreground">
              {template.slug} · {template.owner}/{template.repo}
            </div>
          </td>
          <td className="px-4 py-3 capitalize">{template.category}</td>
          <td className="px-4 py-3 text-muted-foreground">
            {template.labels.length ? template.labels.join(", ") : "-"}
          </td>
          <td className="px-4 py-3 text-right tabular-nums">
            {template.stars?.toLocaleString("en-US") ?? "-"}
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
            <time dateTime={template.fetchedAt}>
              {dateFormatter.format(new Date(template.fetchedAt))}
            </time>
          </td>
          <td className="min-w-56 px-4 py-3">
            <TemplatePublicationStatus
              template={template}
              canManage={canManage}
              onRequest={() => onRequestPublication(template)}
              onWithdraw={() => onWithdrawPublication(template.id)}
            />
          </td>
        </tr>
      ))}
    </tbody>
  )
}

function TemplatePublicationStatus({
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
  const publication = template.publication
  const isCurrent = template.currentlyPublished
  if (publication?.reviewStatus === "pending") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {isCurrent ? <Badge>Published</Badge> : null}
        <Badge variant="secondary">In review</Badge>
        {canManage ? (
          <Button size="sm" variant="outline" onClick={onWithdraw}>
            Withdraw
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <PublicationBadges template={template} />
        {canManage ? (
          <Button size="sm" variant="outline" onClick={onRequest}>
            {isCurrent ? "Submit update" : "Request publication"}
          </Button>
        ) : null}
      </div>
      {publication?.reviewStatus === "rejected" && publication.reviewReason ? (
        <p className="max-w-64 text-xs text-muted-foreground">
          {publication.reviewReason}
        </p>
      ) : null}
    </div>
  )
}

function PublicationBadges({ template }: { template: OrganizationTemplate }) {
  const publication = template.publication
  return (
    <>
      {template.currentlyPublished ? <Badge>Published</Badge> : null}
      {!template.currentlyPublished &&
      publication?.publicationState === "removed" ? (
        <Badge variant="outline">Removed from catalog</Badge>
      ) : null}
      {!template.currentlyPublished &&
      publication?.reviewStatus === "approved" &&
      publication.publicationState === "superseded" ? (
        <Badge variant="outline">Previously published</Badge>
      ) : null}
      {publication?.reviewStatus === "rejected" ? (
        <Badge variant="destructive">Changes requested</Badge>
      ) : null}
      {publication?.reviewStatus === "withdrawn" ? (
        <Badge variant="outline">Withdrawn</Badge>
      ) : null}
    </>
  )
}
