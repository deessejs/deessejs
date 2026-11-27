"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BlocksIcon, SearchIcon } from "lucide-react"
import type { ORPCClient } from "@/lib/orpc"
import { WEB_URL } from "@/lib/app-config"
import { Badge } from "@workspace/ui/components/badge"
import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"

type PublicBlock = Awaited<
  ReturnType<ORPCClient["blocks"]["list"]>
>["blocks"][number]

export function BrowseBlocksPage({
  blocks,
  error,
}: {
  blocks: PublicBlock[]
  error: string | null
}) {
  const [query, setQuery] = useState("")
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return blocks
    return blocks.filter((block) =>
      [block.name, block.description, block.category]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    )
  }, [blocks, query])

  return (
    <main className="space-y-8">
      <header className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <BlocksIcon aria-hidden className="size-4" />
          Public catalogue
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Browse blocks
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Add public capabilities to a project in your workspace.
        </p>
      </header>

      <section aria-label="Public blocks catalogue" className="space-y-5">
        <div className="relative max-w-xl">
          <SearchIcon
            aria-hidden
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Search public blocks"
            placeholder="Search blocks"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        {error ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 px-5 py-8 text-center text-sm text-muted-foreground"
          >
            {error}
          </p>
        ) : blocks.length === 0 ? (
          <p className="rounded-md border border-dashed px-5 py-12 text-center text-sm text-muted-foreground">
            No public blocks are available yet.
          </p>
        ) : visible.length === 0 ? (
          <p className="rounded-md border border-dashed px-5 py-12 text-center text-sm text-muted-foreground">
            No blocks match your search.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {visible.length} {visible.length === 1 ? "block" : "blocks"}
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((block) => {
                const owner =
                  block.ownerType === "platform"
                    ? "official"
                    : block.organizationSlug
                const path = `/blocks/${encodeURIComponent(block.category)}/${encodeURIComponent(`${owner}--${block.slug}`)}`
                return (
                  <li key={block.id}>
                    <Card className="h-full p-5 transition-colors hover:bg-accent/30">
                      <Link
                        href={`${WEB_URL}${path}`}
                        className="flex h-full flex-col gap-3 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="text-lg font-semibold tracking-tight">
                            {block.name}
                          </h2>
                          <Badge variant="outline">{block.category}</Badge>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {block.description}
                        </p>
                      </Link>
                    </Card>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>
    </main>
  )
}
