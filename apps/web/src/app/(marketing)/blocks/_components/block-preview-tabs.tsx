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
 * Client orchestrator for the leaf page tabs. Two tabs:
 * - **Preview** — a mock of the block (labelled, sized by layout).
 * - **Code** — a copy-paste usage snippet.
 *
 * The right side of the tabset row carries a "View source on
 * GitHub" icon button that links the visitor to the block's
 * source folder. Mirror of `ComponentPreviewTabs`.
 */
export function BlockPreviewTabs({ block }: Props) {
  const snippet = getBlockSnippet(block.slug)

  return (
    <Tabs defaultValue="preview" className="w-full">
      <div className="flex items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <Button asChild variant="outline" size="sm">
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
      <TabsContent value="preview" className="mt-4 border border-border bg-background rounded-none">
        <BlockPreview block={block} />
      </TabsContent>
      <TabsContent value="code" className="mt-4">
        <CodeBlock snippet={snippet} />
      </TabsContent>
    </Tabs>
  )
}