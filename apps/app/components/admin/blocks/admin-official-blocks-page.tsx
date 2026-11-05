"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { RouterClient } from "@orpc/server"
import type { appRouter } from "@workspace/api/router"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { BlocksIcon, PlusIcon, SearchIcon } from "lucide-react"
import { CreateOfficialBlockDialog } from "./create-official-block-dialog"

type OfficialBlock = Awaited<
  ReturnType<RouterClient<typeof appRouter>["admin"]["blocks"]["listOfficial"]>
>["blocks"][number]

export function AdminOfficialBlocksPage({
  blocks,
}: {
  blocks: OfficialBlock[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const needle = query.trim().toLocaleLowerCase()
  const filtered = needle
    ? blocks.filter((block) =>
        [block.name, block.slug, block.category, block.repositoryUrl]
          .join(" ")
          .toLocaleLowerCase()
          .includes(needle)
      )
    : blocks

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Official Blocks</h1>
          <p className="text-sm text-muted-foreground">
            Manage platform-owned capability blocks in the public catalog.
          </p>
        </div>
        <AddBlockButton
          onClick={() => setOpen(true)}
          label="Add official block"
        />
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BlocksIcon aria-hidden className="size-4 text-muted-foreground" />
            Platform catalog
          </CardTitle>
          <CardDescription>
            Official blocks are published as soon as their pinned GitHub
            revision passes descriptor validation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="secondary">
            {blocks.length}{" "}
            {blocks.length === 1 ? "official block" : "official blocks"}
          </Badge>
          <p className="text-sm text-muted-foreground">
            Community submissions continue through the review queue.
          </p>
        </CardContent>
      </Card>

      {blocks.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No official blocks yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Add a public GitHub repository containing a valid deesse-block.json
            descriptor.
          </p>
          <AddBlockButton
            onClick={() => setOpen(true)}
            label="Add the first official block"
          />
        </section>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <InputGroup className="w-full sm:max-w-sm">
              <InputGroupAddon>
                <SearchIcon aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search official blocks"
                placeholder="Search blocks"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </InputGroup>
            <p className="text-sm text-muted-foreground">
              {blocks.length} {blocks.length === 1 ? "block" : "blocks"}
            </p>
          </div>
          {filtered.length === 0 ? (
            <p className="rounded-lg border px-6 py-12 text-center text-sm text-muted-foreground">
              No official blocks match your search.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full caption-bottom text-sm">
                <caption className="sr-only">Official Blocks catalog</caption>
                <thead className="border-b bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th scope="col" className="h-11 px-4 font-medium">
                      Block
                    </th>
                    <th scope="col" className="h-11 px-4 font-medium">
                      Category
                    </th>
                    <th scope="col" className="h-11 px-4 font-medium">
                      Pinned revision
                    </th>
                    <th scope="col" className="h-11 px-4 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((block) => (
                    <tr key={block.id}>
                      <td className="max-w-md px-4 py-3">
                        <p className="font-medium">{block.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {block.slug} · {block.repositoryUrl}
                        </p>
                        {block.description ? (
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                            {block.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 capitalize">{block.category}</td>
                      <td className="px-4 py-3">
                        <a
                          className="font-mono text-xs underline-offset-4 hover:underline"
                          href={`${block.repositoryUrl}/tree/${block.sourceCommit}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {block.sourceCommit.slice(0, 12)}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <Badge>Official</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <CreateOfficialBlockDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={() => router.refresh()}
      />
    </div>
  )
}

function AddBlockButton({
  onClick,
  label,
}: {
  onClick: () => void
  label: string
}) {
  return (
    <Button onClick={onClick}>
      <PlusIcon aria-hidden />
      {label}
    </Button>
  )
}
