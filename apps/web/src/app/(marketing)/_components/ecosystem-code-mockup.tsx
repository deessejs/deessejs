"use client"

import { useState } from "react"
import { File } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import type { EcosystemSlug } from "./ecosystem-snippets"

type MockupFile = {
  tabName: string
  html: string
}

/**
 * Per-tab code mockup chrome for the homepage Ecosystem section.
 *
 * Receives the pre-highlighted HTML (Shiki, dual-theme) from the
 * parent Server Component and wraps it in the macOS-style chrome.
 * The parent is responsible for calling `codeToHtml` server-side
 * because Next 16 forbids rendering an async Server Component as
 * a child of a Client Component: the `<EcosystemTabs>` is `"use
 * client"` (Radix Tabs), so the snippets must be rendered up-tree
 * and passed in as plain HTML strings.
 *
 * The dual-theme render (`themes: { light: github-light, dark:
 * github-dark }, defaultColor: false`) relies on the CSS swap in
 * `packages/ui/src/styles/globals.css` around line 169
 * (`html .shiki` -> `var(--shiki-light)`,
 * `html.dark .shiki` -> `var(--shiki-dark)`).
 *
 * Chrome mimics a macOS editor window: three coloured dots at the
 * left of the title bar. When the tool ships multiple files, an
 * inner file-tab strip sits below the dots, mirroring the
 * `<EditorTabs>` pattern used by `cli-workbench.tsx`. Single-file
 * tools (DRPC, Collections) skip the inner tab strip and show the
 * filename in the title bar instead.
 *
 * The `slug` param anchors the visual via `data-slug` on the root
 * so DOM probes (and tests) can identify which tab the rendered
 * mockup belongs to without grepping the HTML body.
 */
export function EcosystemCodeMockup({
  slug,
  files,
}: {
  slug: EcosystemSlug
  /** Pre-highlighted HTML, one entry per file in the tool. */
  files: ReadonlyArray<MockupFile>
}) {
  const isMulti = files.length > 1
  const [activeIndex, setActiveIndex] = useState(0)
  const activeFile = isMulti ? files[activeIndex] : files[0]

  return (
    <div
      data-slug={slug}
      className="bg-background border border-border overflow-hidden rounded-none h-full w-full"
    >
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-background/40 shrink-0">
        <span
          aria-hidden
          className="block size-3 rounded-full bg-[#ff5f57]"
        />
        <span
          aria-hidden
          className="block size-3 rounded-full bg-[#febc2e]"
        />
        <span
          aria-hidden
          className="block size-3 rounded-full bg-[#28c840]"
        />
        {isMulti ? null : (
          <span className="ml-3 font-mono text-[11px] text-muted-foreground truncate">
            {activeFile?.tabName}
          </span>
        )}
      </div>
      {isMulti && activeFile ? (
        <MockupFileTabs
          slug={slug}
          files={files}
          activeIndex={activeIndex}
          onChange={setActiveIndex}
        />
      ) : null}
      <div
        role={isMulti ? "tabpanel" : undefined}
        id={isMulti ? `editor-panel-${slug}-${activeIndex}` : undefined}
        aria-labelledby={
          isMulti ? `editor-tab-${slug}-${activeIndex}` : undefined
        }
        className="overflow-x-auto p-4 text-sm leading-6"
        dangerouslySetInnerHTML={{ __html: activeFile?.html ?? "" }}
      />
    </div>
  )
}

/**
 * Inner file-tab strip for multi-file mockups. Mirrors the
 * `<EditorTabs>` pattern from `cli-workbench.tsx`: a flat
 * `role="tablist"` with one button per file. The active tab
 * "punches through" the parent's `border-b` via `-mb-px border-b
 * border-b-background`. Tab switch is silent (no animation); the
 * body remounts via `key={activeIndex}` to flush any DOM state.
 */
function MockupFileTabs({
  slug,
  files,
  activeIndex,
  onChange,
}: {
  slug: EcosystemSlug
  files: ReadonlyArray<MockupFile>
  activeIndex: number
  onChange: (index: number) => void
}) {
  return (
    <div
      role="tablist"
      aria-label={`${slug} files`}
      className="flex items-center gap-0 overflow-x-auto border-b border-border bg-background shrink-0"
    >
      {files.map((file, idx) => {
        const isActive = idx === activeIndex
        const tabId = `editor-tab-${slug}-${idx}`
        const panelId = `editor-panel-${slug}-${idx}`
        return (
          <Button
            key={file.tabName}
            id={tabId}
            role="tab"
            type="button"
            variant="ghost"
            size="xs"
            aria-selected={isActive}
            aria-controls={panelId}
            onClick={() => onChange(idx)}
            className={
              "group/tab h-auto rounded-none border-0 border-r border-border font-mono text-label-12 px-4 py-2 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" +
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
