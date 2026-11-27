"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import type { RouterClient } from "@orpc/server"
import type { appRouter } from "@workspace/api/router"
import { Button } from "@workspace/ui/components/button"
import Image from "next/image"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  PlusIcon,
  SearchIcon,
  PencilIcon,
} from "lucide-react"
import { CreateTemplateDialog } from "./create-template-dialog"

type AdminClient = RouterClient<typeof appRouter>
type AdminTemplate = Awaited<
  ReturnType<AdminClient["admin"]["templates"]["list"]>
>["templates"][number]

const fetchedAtFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
  },
})
const column = createColumnHelper<typeof features, AdminTemplate>()
const columns = column.columns([
  column.accessor("name", {
    id: "template",
    header: "Template",
    sortFn: "alphanumeric",
    cell: ({ row }) => (
      <>
        {row.original.canonicalUrl ? (
          <Link
            className="font-medium underline-offset-4 hover:underline"
            href={row.original.canonicalUrl}
            target="_blank"
            rel="noreferrer"
          >
            {row.original.name}
          </Link>
        ) : (
          <span className="font-medium">{row.original.name}</span>
        )}
        <div className="mt-1 truncate text-xs text-muted-foreground">
          {row.original.slug} ·{" "}
          {row.original.sourceType === "managed"
            ? "managed archive"
            : `${row.original.owner}/${row.original.repo}`}
        </div>
        {row.original.sourceType === "managed" ? (
          <div className="text-xs text-muted-foreground">
            {row.original.installable
              ? "Release ready to install"
              : "Not installable until the first release is published"}
          </div>
        ) : null}
      </>
    ),
  }),
  column.accessor("category", {
    header: "Category",
    sortFn: "alphanumeric",
    cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
  }),
  column.accessor("labels", {
    header: "Labels",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">
        {getValue().length ? getValue().join(", ") : "—"}
      </span>
    ),
  }),
  column.accessor("access", {
    header: "Access",
    sortFn: "alphanumeric",
    cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
  }),
  column.accessor((template) => template.stars ?? undefined, {
    id: "stars",
    header: "Stars",
    sortFn: "basic",
    sortUndefined: "last",
    cell: ({ getValue }) => (
      <span className="block text-right tabular-nums">
        {getValue()?.toLocaleString("en-US") ?? "—"}
      </span>
    ),
  }),
  column.accessor("fetchedAt", {
    header: "Last fetched",
    sortFn: "alphanumeric",
    cell: ({ getValue }) => {
      const fetchedAt = getValue()
      return fetchedAt ? (
        <time
          className="whitespace-nowrap text-muted-foreground"
          dateTime={fetchedAt}
        >
          {fetchedAtFormatter.format(new Date(fetchedAt))}
        </time>
      ) : (
        <span className="text-muted-foreground">Not fetched</span>
      )
    },
  }),
  column.display({
    id: "presentation",
    header: "Presentation image",
    cell: ({ row }) => (
      <div className="flex min-w-56 items-center gap-3">
        {row.original.imageUrl ? (
          <Image
            src={row.original.imageUrl}
            alt={`${row.original.name} presentation image`}
            width={64}
            height={64}
            unoptimized
            className="size-16 rounded-md border object-cover"
          />
        ) : (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-md border border-dashed text-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>
    ),
  }),
])

export function AdminTemplatesPage({
  templates,
}: {
  templates: AdminTemplate[]
}) {
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<AdminTemplate | null>(
    null
  )
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([])
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
  const table = useTable({
    features,
    columns,
    data: filtered,
    state: { sorting },
    onSortingChange: setSorting,
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
        <Button
          onClick={() => {
            setEditingTemplate(null)
            setDialogOpen(true)
          }}
        >
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
          <Button
            onClick={() => {
              setEditingTemplate(null)
              setDialogOpen(true)
            }}
          >
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
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="h-11 px-4 font-medium"
                    >
                      {header.isPlaceholder ? null : (
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-auto gap-2 px-0 font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                          disabled={!header.column.getCanSort()}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          {header.column.getCanSort() &&
                            (header.column.getIsSorted() === "asc" ? (
                              <ArrowUpIcon aria-hidden className="size-3.5" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ArrowDownIcon aria-hidden className="size-3.5" />
                            ) : (
                              <ArrowUpDownIcon
                                aria-hidden
                                className="size-3.5 opacity-50"
                              />
                            ))}
                        </Button>
                      )}
                    </th>
                  ))}
                  <th scope="col" className="h-11 px-4 text-right font-medium">
                    Actions
                  </th>
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  {row.getAllCells().map((cell) => (
                    <td key={cell.id} className="max-w-80 px-4 py-3">
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(row.original)
                        setDialogOpen(true)
                      }}
                    >
                      <PencilIcon aria-hidden />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateTemplateDialog
        key={editingTemplate?.id ?? "create"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
      />
    </div>
  )
}
