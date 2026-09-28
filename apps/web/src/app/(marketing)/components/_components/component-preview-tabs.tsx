"use client"

import { Badge } from "@workspace/ui/components/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import { isShipped } from "@/registry/is-shipped"

import type { CatalogueComponent } from "./components-list"
import { ComponentCode } from "./component-code"
import { ComponentPreview } from "./component-preview"
import { getComponentSnippet } from "./component-code-snippets"
import { GitHubIcon } from "@/components/catalog/shared/github-icon"

type Props = {
  component: CatalogueComponent
}

const COMPONENTS_REPO_URL =
  "https://github.com/deessejs/deessejs/tree/main/packages/ui/src/components"

/**
 * Client orchestrator for the leaf page tabs. Two regions
 * in the header row:
 *   - **Tabs** (Preview | Code) on the left
 *   - **Install command** inline in the centre, copy-paste ready
 *     — replaced with a "Preview" badge for slugs that aren't
 *     in the registry yet
 *   - **Source** GitHub button on the right
 *
 * Below: Preview mock or Code snippet depending on the active tab.
 * Mirror of `BlockPreviewTabs` (blocks leaf page).
 *
 * The install command assumes the consumer has declared the
 * `@deessejs` namespace in their `components.json` — see
 * `apps/web/src/app/r/README.md` for the setup snippet. Without
 * that declaration the shadcn CLI cannot resolve
 * `@deessejs/<slug>` to the public registry.
 */
export function ComponentPreviewTabs({ component }: Props) {
  const snippet = getComponentSnippet(component.slug)
  const shipped = isShipped(component.slug)
  const installCommand = `npx shadcn@latest add @deessejs/${component.slug}`

  return (
    <Tabs defaultValue="preview" className="w-full">
      <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:justify-between">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <div className="flex flex-1 items-center gap-2">
          {shipped ? (
            <code className="max-w-md flex-1 truncate rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-copy-13 text-foreground">
              {installCommand}
            </code>
          ) : (
            <div className="flex flex-1 items-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2">
              <Badge variant="secondary">Preview</Badge>
              <span className="text-copy-13 text-muted-foreground">
                Package coming in V3.
              </span>
            </div>
          )}
          <a
            href={COMPONENTS_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${component.name} source on GitHub (opens in a new tab)`}
            className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-copy-14 font-medium text-foreground transition-colors hover:bg-accent/30"
          >
            <GitHubIcon className="size-4" />
            <span className="hidden sm:inline">Source</span>
          </a>
        </div>
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
