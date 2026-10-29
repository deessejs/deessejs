"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { PlusIcon, SearchIcon } from "lucide-react"
import type { RouterClient } from "@orpc/server"
import type { appRouter } from "@workspace/api/router"
import { CreateOrganizationTemplateDialog } from "./create-organization-template-dialog"

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
      />
      {canManage && (
        <CreateOrganizationTemplateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          organizationSlug={organizationSlug}
          onCreated={() => router.refresh()}
        />
      )}
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
}: {
  templates: OrganizationTemplate[]
  organizationName: string
  canManage: boolean
  fetchError: string | null
  onAdd: () => void
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
}: {
  templates: OrganizationTemplate[]
  organizationName: string
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
              </tr>
            </thead>
            <TemplateRows templates={filtered} />
          </table>
        </div>
      )}
    </div>
  )
}

function TemplateRows({ templates }: { templates: OrganizationTemplate[] }) {
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
        </tr>
      ))}
    </tbody>
  )
}
