"use client"

import { File } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import type { CliStartTool } from "./cli-start-snippets"

type MockupFile = {
  tabName: string
  html: string
}

/**
 * Per-tab code mockup chrome for the /cli "Get started" section.
 *
 * Mirrors the visual vocabulary of the homepage
 * `<EcosystemCodeMockup>`: macOS-style title bar with three
 * coloured dots, optional inner file-tab strip for multi-file
 * tools, Shiki-highlighted body. Same chrome, same background,
 * same code-block design. Different content.
 *
 * Receives pre-highlighted HTML from the parent Server Component
 * (CliPage) because Next 16 forbids rendering an async Server
 * Component as a child of a Client Component. The `<CliStartTabs>`
 * is `"use client"` (Radix Tabs), so the snippets travel through
 * the boundary as plain HTML strings.
 */
export function CliStartMockup({
  slug,
  files,
}: {
  slug: string
  /** Pre-highlighted HTML, one entry per file in the step. */
  files: ReadonlyArray<MockupFile>
}) {
  const isMulti = files.length > 1
  const activeFile = files[0]
  if (!activeFile) return null

  return (
    <div
      data-slug={slug}
      className="bg-background border border-border overflow-hidden rounded-none h-full w-full"
    >
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-background/40 shrink-0">
        <span aria-hidden className="block size-3 rounded-full bg-[#ff5f57]" />
        <span aria-hidden className="block size-3 rounded-full bg-[#febc2e]" />
        <span aria-hidden className="block size-3 rounded-full bg-[#28c840]" />
        {isMulti ? null : (
          <span className="ml-3 font-mono text-[11px] text-muted-foreground truncate">
            {activeFile.tabName}
          </span>
        )}
      </div>
      {isMulti && files.length > 1 ? (
        <MockupFileTabs files={files} />
      ) : null}
      <div
        role={isMulti ? "tabpanel" : undefined}
        className="overflow-x-auto p-4 text-sm leading-6"
        dangerouslySetInnerHTML={{ __html: activeFile.html }}
      />
    </div>
  )
}

function MockupFileTabs({ files }: { files: ReadonlyArray<MockupFile> }) {
  return (
    <div
      role="tablist"
      className="flex items-center gap-0 overflow-x-auto border-b border-border bg-background shrink-0"
    >
      {files.map((file, idx) => {
        const isActive = idx === 0
        return (
          <Button
            key={file.tabName}
            role="tab"
            type="button"
            variant="ghost"
            size="xs"
            aria-selected={isActive}
            className={
              "group/tab h-auto rounded-none border-0 border-r border-border font-mono text-label-12 px-4 py-2 hover:bg-accent/40" +
              (isActive
                ? " -mb-px border-b border-b-background bg-background text-foreground"
                : " text-muted-foreground")
            }
          >
            <File aria-hidden className="size-3 shrink-0" />
            <span>{file.tabName}</span>
          </Button>
        )
      })}
    </div>
  )
}

// `CliStartTool` is re-exported to keep the import line stable
// across page.tsx → cli-start.tsx → cli-start-mockup.tsx.
export type { CliStartTool }
