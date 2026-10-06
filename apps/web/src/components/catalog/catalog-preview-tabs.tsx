"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import { CatalogCode } from "@/components/catalog/catalog-code"
import { GitHubIcon } from "@/components/catalog/shared/github-icon"
import { isShipped } from "@/registry/is-shipped"
import type { ReactNode } from "react"

type Props = {
  /** Slug used to look up `isShipped()` and build the install command. */
  slug: string
  /**
   * Either the component name or the block name — folded into the
   * `aria-label` of the Source link so screen readers announce
   * "View <name> source on GitHub".
   */
  itemName: string
  /** What kind of catalogue entry this is — surfaces in the aria-label. */
  itemKind: "component" | "block"
  /** URL of the GitHub repo where the source lives. The Source button links here. */
  sourceRepoUrl: string
  /**
   * Code snippet pre-resolved by the caller (each surface knows
   * how to look up its own snippet via its own data layer).
   * Used by `<CatalogCode>` inside the "Code" tab.
   */
  snippet: string
  /**
   * Slot for the live preview. The surfaces each render their
   * own preview component (components render the actual shadcn
   * primitive; blocks render a layout-shaped mock).
   */
  preview: ReactNode
}

/**
 * Catalog chrome: preview tabs orchestrator.
 *
 * Client-side orchestrator for the leaf page (the
 * `/<surface>/[category]/[item]` page) tabs. Three regions in
 * the header row:
 *   - **Tabs** (Preview | Code) on the left
 *   - **Install command** inline in the centre, copy-paste ready
 *     — replaced with a "Preview" badge for slugs that aren't
 *     in the registry yet
 *   - **Source** GitHub button on the right
 *
 * Below: `preview` slot or `snippet` rendered through
 * `<CatalogCode>` depending on the active tab.
 *
 * Pre-refactor: this was duplicated as
 * `component-preview-tabs.tsx` (raw `<a>` for the Source button)
 * and `block-preview-tabs.tsx` (`<Button asChild>` for the Source
 * button). The block pattern is the one preserved here — wrapping
 * the source link in `<Button asChild>` keeps focus rings, hover
 * treatments, and accessibility wiring consistent with the rest
 * of the design system.
 */
export function CatalogPreviewTabs({
  slug,
  itemName,
  itemKind,
  sourceRepoUrl,
  snippet,
  preview,
}: Props) {
  const shipped = isShipped(slug)
  // shadcn CLI command against the DeesseJS registry. Consumer
  // must declare the registry once in their `components.json`:
  //   "registries": { "@deessejs": "https://deessejs.com/r/{name}.json" }
  // then run `npx shadcn@latest add @deessejs/<slug>`.
  const installCommand = `npx shadcn@latest add @deessejs/${slug}`

  return (
    <Tabs defaultValue="preview" className="w-full">
      <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:justify-between">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
          {shipped ? (
            <code className="max-w-md truncate rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-copy-13 text-foreground">
              {installCommand}
            </code>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2">
              <Badge variant="secondary">Preview</Badge>
              <span className="text-copy-13 text-muted-foreground">
                Package coming in V3.
              </span>
            </div>
          )}
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <a
              href={sourceRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${itemKind} ${itemName} source on GitHub (opens in a new tab)`}
              className="flex items-center gap-2"
            >
              <GitHubIcon className="size-4" />
              <span className="hidden sm:inline">Source</span>
            </a>
          </Button>
        </div>
      </div>
      <TabsContent
        value="preview"
        className="mt-4 border border-border bg-background rounded-none"
      >
        {preview}
      </TabsContent>
      <TabsContent value="code" className="mt-4">
        <CatalogCode snippet={snippet} />
      </TabsContent>
    </Tabs>
  )
}
