import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { Button } from "@workspace/ui/components/button"

import type { CatalogueComponent } from "./components-list"
import { ComponentCode } from "./component-code"
import { ComponentPreview } from "./component-preview"
import { getComponentSnippet } from "./component-code-snippets"
import { GitHubIcon } from "./github-icon"

type Props = {
  component: CatalogueComponent
}

const COMPONENTS_REPO_URL =
  "https://github.com/deessejs/deessejs/tree/main/packages/ui/components"

/**
 * Client orchestrator for the leaf page tabs. Two tabs:
 * - **Preview** — a live render of the component using the
 *   actual shadcn primitive.
 * - **Code** — a copy-paste usage snippet.
 *
 * The `<TabsList>` sits on the left and a "View source on GitHub"
 * icon button sits on the right of the same row, mirroring the
 * shadcnblocks detail-page affordance.
 *
 * The whole component is `"use client"` because the `<Tabs>`
 * primitive is client-only (Radix). `ComponentCode` and
 * `ComponentPreview` are server components — Next.js handles
 * RSC-inside-CSC correctly.
 */
export function ComponentPreviewTabs({ component }: Props) {
  const snippet = getComponentSnippet(component.slug)
  const sourceHref = `${COMPONENTS_REPO_URL}/${component.slug}.tsx`

  return (
    <Tabs defaultValue="preview" className="w-full">
      <div className="flex items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <Button asChild variant="outline" size="sm">
          <a
            href={sourceHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${component.name} source on GitHub (opens in a new tab)`}
            className="flex items-center gap-2"
          >
            <GitHubIcon className="size-4" />
            <span className="hidden sm:inline">Source</span>
          </a>
        </Button>
      </div>
      <TabsContent value="preview" className="mt-4 border border-border bg-background rounded-none">
        <ComponentPreview slug={component.slug} />
      </TabsContent>
      <TabsContent value="code" className="mt-4">
        <ComponentCode snippet={snippet} />
      </TabsContent>
    </Tabs>
  )
}