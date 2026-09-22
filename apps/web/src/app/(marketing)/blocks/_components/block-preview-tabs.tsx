import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { Button } from "@workspace/ui/components/button"

import type { CatalogueBlock } from "./blocks-list"
import { BlockPreview } from "./block-preview"
import { getBlockSnippet } from "./block-code-snippets"
import { CodeBlock } from "./code-block"
import { GitHubIcon } from "@/app/(marketing)/components/_components/github-icon"

type Props = {
  block: CatalogueBlock
}

const BLOCKS_REPO_URL = "https://github.com/deessejs/deessejs"

/**
 * Client orchestrator for the leaf page tabs. Three regions
 * in the header row:
 *   - **Tabs** (Preview | Code) on the left
 *   - **Install command** inline in the centre, copy-paste ready
 *   - **Source** GitHub button on the right
 *
 * Below: Preview mock or Code snippet depending on the active tab.
 *
 * Mirror of `ComponentPreviewTabs`. The install command sits
 * inline in the same row as the tabs because it's a top-level
 * affordance — the user shouldn't have to switch tabs to find it.
 */
export function BlockPreviewTabs({ block }: Props) {
  const snippet = getBlockSnippet(block.slug)
  // shadcn CLI command against the DeesseJS registry. Consumer must
  // declare the registry once in their `components.json`:
  //   "registries": { "@deessejs": "https://deessejs.com/r/{name}.json" }
  // then run `npx shadcn@latest add @deessejs/<slug>`.
  const installCommand = `npx shadcn@latest add @deessejs/${block.slug}`

  return (
    <Tabs defaultValue="preview" className="w-full">
      <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:justify-between">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
          <code className="max-w-md truncate rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-copy-13 text-foreground">
            {installCommand}
          </code>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <a
              href={BLOCKS_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View block source on GitHub (opens in a new tab)`}
              className="flex items-center gap-2"
            >
              <GitHubIcon className="size-4" />
              <span className="hidden sm:inline">Source</span>
            </a>
          </Button>
        </div>
      </div>
      <TabsContent value="preview" className="mt-4 border border-border bg-background rounded-none">
        <BlockPreview block={block} />
      </TabsContent>
      <TabsContent value="code" className="mt-4">
        <CodeBlock snippet={snippet} />
      </TabsContent>
    </Tabs>
  )
}