"use client"

import { useMemo, useState } from "react"
import { useLegacyTable } from "@tanstack/react-table/legacy"
import type { RouterClient } from "@orpc/server"
import type { appRouter } from "@workspace/api/router"
import { Button } from "@workspace/ui/components/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { PlusIcon, SearchIcon } from "lucide-react"
import { CreateTemplateDialog } from "./create-template-dialog"

type AdminClient = RouterClient<typeof appRouter>
type AdminTemplate = Awaited<
  ReturnType<AdminClient["admin"]["templates"]["list"]>
>["templates"][number]

const fetchedAtFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

export function AdminTemplatesPage({
  templates,
}: {
  templates: AdminTemplate[]
}) {
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const needle = query.trim().toLocaleLowerCase()
  const filtered = useMemo(
    () =>
      needle
        ? templates.filter((template) =>
            [template.name, template.slug, template.owner, template.repo]
              .join(" ")
              .toLocaleLowerCase()
              .includes(needle)
          )
        : templates,
    [needle, templates]
  )
  const table = useLegacyTable({
    data: filtered,
    columns: [{ accessorKey: "id" }],
  })

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Manage the official catalog and its GitHub repository snapshots.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <PlusIcon aria-hidden />
          Add template
        </Button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <InputGroup className="w-full sm:max-w-sm">
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search templates"
            placeholder="Search templates"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
        <p className="text-sm text-muted-foreground">
          {templates.length} {templates.length === 1 ? "template" : "templates"}
        </p>
      </div>

      {templates.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No templates yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Add a public GitHub repository to start building the official
            template catalog.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon aria-hidden />
            Add your first template
          </Button>
        </section>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border px-6 py-12 text-center text-sm text-muted-foreground">
          No templates match your search.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full caption-bottom text-sm">
            <caption className="sr-only">Official templates</caption>
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
                  Access
                </th>
                <th scope="col" className="h-11 px-4 text-right font-medium">
                  Stars
                </th>
                <th scope="col" className="h-11 px-4 font-medium">
                  Last fetched
                </th>
              </tr>
            </thead>
            <tbody>
              {table.getRowModel().rows.map(({ original: template }) => (
                <tr key={template.id} className="border-b last:border-0">
                  <td className="max-w-80 px-4 py-3">
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
                  <td className="max-w-64 px-4 py-3 text-muted-foreground">
                    {template.labels.length ? template.labels.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3 capitalize">{template.access}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {template.stars?.toLocaleString() ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    <time dateTime={template.fetchedAt}>
                      {fetchedAtFormatter.format(new Date(template.fetchedAt))}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateTemplateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
