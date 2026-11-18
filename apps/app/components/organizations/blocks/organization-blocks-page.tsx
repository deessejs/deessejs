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
import { SearchIcon, PlusIcon, BlocksIcon } from "lucide-react"
import { AddOrganizationBlockDialog } from "./add-organization-block-dialog"
import { SubmitOrganizationBlockDialog } from "./submit-organization-block-dialog"

type OrganizationBlock = Awaited<
  ReturnType<RouterClient<typeof appRouter>["organization"]["blocks"]["list"]>
>["blocks"][number]

export function OrganizationBlocksPage({
  organizationSlug,
  organizationName,
  blocks,
  canManage,
  error,
}: {
  organizationSlug: string
  organizationName: string
  blocks: OrganizationBlock[]
  canManage: boolean
  error: string | null
}) {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<OrganizationBlock | null>(
    null
  )

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Blocks</h1>
          <p className="text-sm text-muted-foreground">
            DeesseJS capabilities managed by {organizationName}.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setAddOpen(true)}>
            <PlusIcon aria-hidden />
            Add block
          </Button>
        ) : null}
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BlocksIcon aria-hidden className="size-4 text-muted-foreground" />
            Organization Blocks
          </CardTitle>
          <CardDescription>
            Import a GitHub repository with a valid deesse-block.json
            descriptor, then submit a pinned revision for community review.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{blocks.length} total</Badge>
            <Badge>
              {
                blocks.filter((block) => block.publicationState === "current")
                  .length
              }{" "}
              published
            </Badge>
            <Badge variant="outline">
              {
                blocks.filter((block) => block.reviewStatus === "pending")
                  .length
              }{" "}
              in review
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Published revisions stay available while updates are reviewed.
          </p>
        </CardContent>
      </Card>

      {error ? (
        <p
          className="rounded-md border border-destructive/30 p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : blocks.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No blocks yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {canManage
              ? "Import a public GitHub repository containing deesse-block.json to create the first private block."
              : "An organization owner or admin can import the first block."}
          </p>
          {canManage ? (
            <Button onClick={() => setAddOpen(true)}>
              <PlusIcon aria-hidden />
              Add your first block
            </Button>
          ) : null}
        </section>
      ) : (
        <BlocksTable
          blocks={blocks}
          canManage={canManage}
          onSubmit={(block) => setSelectedBlock(block)}
        />
      )}

      {canManage ? (
        <AddOrganizationBlockDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          organizationSlug={organizationSlug}
          onCreated={() => router.refresh()}
        />
      ) : null}
      {canManage && selectedBlock ? (
        <SubmitOrganizationBlockDialog
          open={selectedBlock !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedBlock(null)
          }}
          organizationSlug={organizationSlug}
          block={selectedBlock}
          onSubmitted={() => router.refresh()}
        />
      ) : null}
    </div>
  )
}

function BlocksTable({
  blocks,
  canManage,
  onSubmit,
}: {
  blocks: OrganizationBlock[]
  canManage: boolean
  onSubmit: (block: OrganizationBlock) => void
}) {
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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <InputGroup className="w-full sm:max-w-sm">
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search organization blocks"
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
          No blocks match your search.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full caption-bottom text-sm">
            <caption className="sr-only">
              Blocks managed by this organization
            </caption>
            <thead className="border-b bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th scope="col" className="h-11 px-4 font-medium">
                  Block
                </th>
                <th scope="col" className="h-11 px-4 font-medium">
                  Category
                </th>
                <th scope="col" className="h-11 px-4 font-medium">
                  Revision
                </th>
                <th scope="col" className="h-11 px-4 font-medium">
                  Publication
                </th>
                {canManage ? (
                  <th scope="col" className="h-11 px-4 font-medium">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((block) => (
                <tr key={block.id}>
                  <td className="max-w-sm px-4 py-3">
                    <div className="font-medium">{block.name}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {block.slug} · {block.repositoryUrl}
                    </div>
                    {block.description ? (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {block.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 capitalize">{block.category}</td>
                  <td className="px-4 py-3">
                    <code className="font-mono text-xs text-muted-foreground">
                      {block.sourceCommit.slice(0, 7)}
                    </code>
                  </td>
                  <td className="min-w-48 px-4 py-3">
                    <PublicationState block={block} />
                  </td>
                  {canManage ? (
                    <td className="px-4 py-3">
                      {block.reviewStatus === "pending" ? (
                        <span className="text-sm text-muted-foreground">
                          Under review
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSubmit(block)}
                        >
                          {block.publicationState === "current"
                            ? "Submit update"
                            : "Submit revision"}
                        </Button>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PublicationState({ block }: { block: OrganizationBlock }) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap gap-2">
        {block.publicationState === "current" ? <Badge>Published</Badge> : null}
        {block.reviewStatus === "pending" ? (
          <Badge variant="secondary">In review</Badge>
        ) : null}
        {block.reviewStatus === "rejected" ? (
          <Badge variant="destructive">Changes requested</Badge>
        ) : null}
        {block.publicationState === "superseded" ? (
          <Badge variant="outline">Previous revision</Badge>
        ) : null}
        {block.reviewStatus === "draft" ? (
          <Badge variant="outline">Private</Badge>
        ) : null}
      </div>
      {block.reviewStatus === "rejected" && block.reviewReason ? (
        <p className="max-w-64 text-xs text-muted-foreground">
          {block.reviewReason}
        </p>
      ) : null}
    </div>
  )
}
