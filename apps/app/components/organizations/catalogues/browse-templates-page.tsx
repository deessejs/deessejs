"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { CompassIcon, SearchIcon } from "lucide-react"
import type {
  CommunityTemplateSummaryV1Type,
  TemplateSummaryV1Type,
} from "@workspace/contracts/v1"
import {
  CATEGORY_LABELS,
  CATEGORY_SLUGS,
  FRAMEWORK_LABELS,
  FRAMEWORK_SLUGS,
} from "@workspace/api/templates-labels"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Card } from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { WEB_URL } from "@/lib/app-config"

type CatalogTemplate = TemplateSummaryV1Type | CommunityTemplateSummaryV1Type

export function BrowseTemplatesPage({
  templates,
  error,
}: {
  templates: CatalogTemplate[]
  error: string | null
}) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [framework, setFramework] = useState("all")
  const categories = CATEGORY_SLUGS
  const frameworks = FRAMEWORK_SLUGS
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return templates.filter((template) => {
      const matchesQuery =
        !normalized ||
        [template.name, template.description, ...template.labels]
          .join(" ")
          .toLowerCase()
          .includes(normalized)
      if (!matchesQuery) return false
      if (category !== "all" && template.category !== category) return false
      return framework === "all" || template.labels.includes(framework)
    })
  }, [category, framework, query, templates])

  return (
    <main className="space-y-8">
      <header className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CompassIcon aria-hidden className="size-4" />
          Public catalogue
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Browse templates
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Explore public starters from DeesseJS and the community.
        </p>
      </header>

      <section aria-label="Template catalogue" className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-1">
            <SearchIcon
              aria-hidden
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              aria-label="Search public templates"
              placeholder="Search templates"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value ?? "all")}
          >
            <SelectTrigger
              aria-label="Filter templates by category"
              className="h-10 w-full"
            >
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((value) => (
                <SelectItem key={value} value={value}>
                  {CATEGORY_LABELS[value]} (
                  {
                    templates.filter((template) => template.category === value)
                      .length
                  }
                  )
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={framework}
            onValueChange={(value) => setFramework(value ?? "all")}
          >
            <SelectTrigger
              aria-label="Filter templates by framework"
              className="h-10 w-full"
            >
              <SelectValue placeholder="All frameworks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All frameworks</SelectItem>
              {frameworks.map((value) => (
                <SelectItem key={value} value={value}>
                  {FRAMEWORK_LABELS[value]} (
                  {
                    templates.filter((template) =>
                      template.labels.includes(value)
                    ).length
                  }
                  )
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 px-5 py-8 text-center text-sm text-muted-foreground"
          >
            {error}
          </p>
        ) : templates.length === 0 ? (
          <p className="rounded-md border border-dashed px-5 py-12 text-center text-sm text-muted-foreground">
            No public templates are available yet.
          </p>
        ) : visible.length === 0 ? (
          <p className="rounded-md border border-dashed px-5 py-12 text-center text-sm text-muted-foreground">
            No templates match these filters. Adjust your search or filters.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {visible.length} {visible.length === 1 ? "template" : "templates"}
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((template) => {
                const community = "community" in template && template.community
                const detailPath = community
                  ? `/templates/community/${encodeURIComponent(template.organizationSlug)}/${encodeURIComponent(template.templateSlug)}`
                  : `/templates/${encodeURIComponent(template.slug)}`
                const imageSrc = template.previewImageUrl
                  ? template.previewImageUrl
                  : template.image
                    ? new URL(template.image, WEB_URL).toString()
                    : null
                return (
                  <li key={template.slug}>
                    <Card className="h-full transition-colors hover:bg-accent/30">
                      <Link
                        href={`${WEB_URL}${detailPath}`}
                        className="flex h-full flex-col rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <div className="relative aspect-video overflow-hidden border-b bg-muted/40">
                          {imageSrc ? (
                            <Image
                              src={imageSrc}
                              alt={`${template.name} preview`}
                              fill
                              unoptimized
                              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="flex flex-1 flex-col gap-3 p-5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h2 className="text-lg font-semibold tracking-tight">
                              {template.name}
                            </h2>
                            <div className="flex gap-1.5">
                              {community ? (
                                <Badge variant="secondary">Community</Badge>
                              ) : null}
                              <Badge variant="outline">
                                {template.category}
                              </Badge>
                            </div>
                          </div>
                          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                            {template.description}
                          </p>
                          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                            {template.labels.map((label) => (
                              <Badge key={label} variant="secondary">
                                {label}
                              </Badge>
                            ))}
                          </div>
                        </div>
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
