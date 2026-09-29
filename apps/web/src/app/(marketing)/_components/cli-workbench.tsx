"use client"

import { useState } from "react"
import * as m from "motion/react-m"
import { LazyMotion, domAnimation, useReducedMotion } from "motion/react"
import { File, FilePlus, Folder, FolderOpen, FolderPlus, TerminalSquare, X } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import {
  DEV_OUTPUT_LINE,
  EDITOR_TABS,
  INIT_OUTPUT_LINES,
  SAAS_STARTER_FILES,
  type EditorTabId,
  type ExplorerNode,
} from "@/lib/marketing/cli-workbench-data"

/**
 * CLI workbench — IDE-style transformation panel shown on the
 * marketing homepage (Section 7, CliInAction).
 *
 * Three panes inside a single shared-border frame, mirroring the
 * layout of a code editor:
 *   • Explorer  (top-left)  : file tree that fills as `init`
 *                            clones the template.
 *   • Editor    (top-right) : tabbed view (package.json /
 *                            AGENTS.md). The active tab reveals
 *                            its snippet on entry.
 *   • Terminal  (bottom)    : shows the canonical `deessejs init`
 *                            command, then its real output, then
 *                            `pnpm dev` (a separate command —
 *                            `init` does NOT start the server).
 *
 * Choreography (plays once on viewport entry, ~4s total):
 *   t=0.0s   terminal prompt + command 1 starts typing
 *   t=0.6s   init output lines fade in
 *   t=1.4s   explorer nodes stagger in
 *   t=2.4s   editor (default tab) reveals (clip-path top→bottom)
 *   t=2.6s   command 2 (`pnpm dev`) starts typing
 *   t=3.2s   dev output line appears
 *
 * Editor tabs are interactive after the reveal — clicking a tab
 * swaps the snippet in place. No animation between tabs (the
 * reveal animation already plays once on viewport entry; toggling
 * tabs is a discrete user action).
 *
 * `useReducedMotion` short-circuits to a static variant — same
 * layout, same tabs, same content, all visible immediately.
 *
 * Source-of-truth: `apps/cli/src/commands/init.ts` (clone +
 * detect PM + install). The template layout is a curated list in
 * `cli-workbench-data.ts`; update both in lockstep.
 */
export function CliWorkbench({
  editorHtml,
}: {
  /** Pre-highlighted Shiki HTML per editor tab id. */
  editorHtml: Record<EditorTabId, string>
}) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <StaticWorkbench editorHtml={editorHtml} />
  }

  return (
    <LazyMotion features={domAnimation}>
      <AnimatedWorkbench editorHtml={editorHtml} />
    </LazyMotion>
  )
}

// ----------------------------------------------------------------------
// Animated variant
// ----------------------------------------------------------------------

function AnimatedWorkbench({
  editorHtml,
}: {
  editorHtml: Record<EditorTabId, string>
}) {
  return (
    <div
      role="img"
      aria-label="IDE workbench: a file tree fills as the CLI clones the saas-starter template, then pnpm dev starts the dev server."
      className="flex h-full flex-col overflow-hidden border border-border bg-background"
    >
      <div className="grid flex-1 grid-cols-[minmax(0,3fr)_minmax(0,9fr)] divide-x divide-border">
        <ExplorerPane />
        <EditorPane editorHtml={editorHtml} animated />
      </div>

      <TerminalPane />
    </div>
  )
}

function ExplorerPane() {
  return (
    <div className="flex flex-col">
      <PaneHeader
        title="Explorer"
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="New file"
              className="rounded-none! text-muted-foreground hover:bg-accent/40 hover:text-foreground"
            >
              <FilePlus aria-hidden className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="New folder"
              className="rounded-none! text-muted-foreground hover:bg-accent/40 hover:text-foreground"
            >
              <FolderPlus aria-hidden className="size-3.5" />
            </Button>
          </>
        }
      />
      <div className="flex-1 overflow-hidden p-4 pt-2">
        <ExplorerNodeView node={SAAS_STARTER_FILES[0]!} depth={0} />
      </div>
    </div>
  )
}

function ExplorerNodeView({
  node,
  depth,
}: {
  node: ExplorerNode
  depth: number
}) {
  const baseDelay = 1.4 + depth * 0.1
  const leafStagger = 0.12
  const indexInLevel = depth === 0 ? 0 : Number(depth)

  const isFolder = Boolean(node.children?.length)
  const Icon = isFolder ? FolderOpen : File

  return (
    <m.div
      initial={{ opacity: 0, x: -4 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{
        duration: 0.25,
        delay: baseDelay + indexInLevel * leafStagger,
        ease: "easeOut" as const,
      }}
    >
      <div
        className="flex items-center gap-1.5 py-0.5 font-mono text-label-13 text-foreground"
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <Icon
          aria-hidden
          className={cn(
            "size-3 shrink-0",
            isFolder ? "text-foreground" : "text-muted-foreground",
          )}
        />
        <span>{node.name}</span>
      </div>
      {node.children?.map((child, i) => (
        <ExplorerNodeView
          key={child.name + i}
          node={child}
          depth={depth + 1}
        />
      ))}
    </m.div>
  )
}

function EditorPane({
  editorHtml,
  animated,
}: {
  editorHtml: Record<EditorTabId, string>
  /**
   * When true, the active tab's snippet reveals with a
   * clip-path animation on first viewport entry. After the
   * initial reveal, tab switches swap instantly.
   */
  animated: boolean
}) {
  const [activeTab, setActiveTab] = useState<EditorTabId>(EDITOR_TABS[0]!.id)

  const snippetClassName =
    "flex-1 overflow-auto border-t-0 border-border bg-background p-3 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:text-label-12 [&_pre]:leading-relaxed"

  return (
    <div className="flex flex-col">
      <EditorTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {animated ? (
        <m.div
          key={activeTab}
          initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 0.25, ease: "easeOut" as const }}
          className={snippetClassName}
          dangerouslySetInnerHTML={{ __html: editorHtml[activeTab] }}
        />
      ) : (
        <div
          key={activeTab}
          className={snippetClassName}
          dangerouslySetInnerHTML={{ __html: editorHtml[activeTab] }}
        />
      )}
    </div>
  )
}

function EditorTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: EditorTabId
  onTabChange: (id: EditorTabId) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Editor file tabs"
      className="flex items-center gap-0 overflow-x-auto border-b border-border"
    >
      {EDITOR_TABS.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <Button
            key={tab.id}
            type="button"
            role="tab"
            variant="ghost"
            size="xs"
            aria-selected={isActive}
            aria-controls={`editor-panel-${tab.id}`}
            id={`editor-tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "group/tab h-auto rounded-none! border-r border-border px-4 py-2 font-mono text-label-12 hover:bg-accent/40",
              isActive
                ? "-mb-px border-b border-b-background bg-background text-foreground"
                : "text-muted-foreground",
            )}
          >
            <File aria-hidden className="size-3 shrink-0" />
            <span>{tab.label}</span>
            {isActive ? (
              <X
                aria-hidden
                className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/tab:opacity-100"
              />
            ) : null}
          </Button>
        )
      })}
    </div>
  )
}

/**
 * Pane header — used by Explorer (and any future pane that wants a
 * sticky title row). Title on the left, optional icon actions on
 * the right, separated from the body by a `border-b`.
 *
 * The Explorer "new file" / "new folder" actions are decorative:
 * they advertise the IDE affordance without binding to real logic,
 * because the file tree is a curated storyboard, not an editable
 * filesystem.
 */
function PaneHeader({
  title,
  actions,
}: {
  title: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
      <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {actions ? (
        <div className="flex items-center gap-0.5">{actions}</div>
      ) : null}
    </div>
  )
}

function TerminalPane() {
  return (
    <div className="flex flex-col gap-2 border-t border-border p-4">
      <p className="flex items-center gap-1.5 text-label-13 uppercase tracking-wider text-muted-foreground">
        <TerminalSquare aria-hidden className="size-3" />
        Terminal
      </p>
      <div className="flex flex-col gap-1 overflow-hidden font-mono text-label-13 leading-relaxed text-foreground">
        <TypedLine text="$ deessejs init saas-starter" delay={0} duration={0.6} />
        {INIT_OUTPUT_LINES.map((line, i) => (
          <m.div
            key={line}
            initial={{ opacity: 0, x: -2 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{
              duration: 0.25,
              delay: 0.7 + i * 0.15,
              ease: "easeOut" as const,
            }}
            className="text-muted-foreground"
          >
            {line}
          </m.div>
        ))}

        {/* Command 2: pnpm dev (a SEPARATE command — init does not
            start the server) */}
        <TypedLine text="$ pnpm dev" delay={2.6} duration={0.5} />
        <m.div
          initial={{ opacity: 0, x: -2 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{
            duration: 0.25,
            delay: 3.2,
            ease: "easeOut" as const,
          }}
          className="text-muted-foreground"
        >
          {DEV_OUTPUT_LINE}
        </m.div>
      </div>
    </div>
  )
}

/**
 * Typewriter line that reveals `text` over `duration` seconds.
 * Avoids the N-mount cost of per-character motion spans (used in
 * DbTerminalMockup): we animate the whole text element's clip-path
 * from `inset(0 100% 0 0)` to `inset(0 0% 0 0)`, which gives the
 * same visual effect with one DOM node per line.
 */
function TypedLine({
  text,
  delay,
  duration,
}: {
  text: string
  delay: number
  duration: number
}) {
  return (
    <m.div
      initial={{ clipPath: "inset(0 100% 0 0)", opacity: 1 }}
      whileInView={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{
        duration,
        delay,
        ease: "linear" as const,
      }}
    >
      {text}
    </m.div>
  )
}

// ----------------------------------------------------------------------
// Static variant (prefers-reduced-motion)
// ----------------------------------------------------------------------

function StaticWorkbench({
  editorHtml,
}: {
  editorHtml: Record<EditorTabId, string>
}) {
  return (
    <div
      role="img"
      aria-label="IDE workbench showing a populated saas-starter project: file tree, tabbed editor, terminal session where deessejs init and pnpm dev have run."
      className="flex h-full flex-col overflow-hidden border border-border bg-background"
    >
      <div className="grid flex-1 grid-cols-[minmax(0,3fr)_minmax(0,9fr)] divide-x divide-border">
        <div className="flex flex-col">
          <PaneHeader
            title="Explorer"
            actions={
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="New file"
                  className="rounded-none! text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                >
                  <FilePlus aria-hidden className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="New folder"
                  className="rounded-none! text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                >
                  <FolderPlus aria-hidden className="size-3.5" />
                </Button>
              </>
            }
          />
          <div className="flex-1 overflow-hidden p-4 pt-2">
            <StaticExplorer node={SAAS_STARTER_FILES[0]!} depth={0} />
          </div>
        </div>
        <EditorPane editorHtml={editorHtml} animated={false} />
      </div>
      <div className="flex flex-col gap-2 border-t border-border p-4">
        <p className="flex items-center gap-1.5 text-label-13 uppercase tracking-wider text-muted-foreground">
          <TerminalSquare aria-hidden className="size-3" />
          Terminal
        </p>
        <div className="flex flex-col gap-1 overflow-hidden font-mono text-label-13 leading-relaxed text-foreground">
          <div>$ deessejs init saas-starter</div>
          {INIT_OUTPUT_LINES.map((line) => (
            <div key={line} className="text-muted-foreground">
              {line}
            </div>
          ))}
          <div>$ pnpm dev</div>
          <div className="text-muted-foreground">{DEV_OUTPUT_LINE}</div>
        </div>
      </div>
    </div>
  )
}

function StaticExplorer({
  node,
  depth,
}: {
  node: ExplorerNode
  depth: number
}) {
  const isFolder = Boolean(node.children?.length)
  const Icon = isFolder ? FolderOpen : File
  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-0.5 font-mono text-label-13 text-foreground"
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <Icon
          aria-hidden
          className={cn(
            "size-3 shrink-0",
            isFolder ? "text-foreground" : "text-muted-foreground",
          )}
        />
        <span>{node.name}</span>
      </div>
      {node.children?.map((child, i) => (
        <StaticExplorer
          key={child.name + i}
          node={child}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

// `Folder` is imported but only FolderOpen is used; suppress the
// unused-import warning in case a future caller wants the closed
// folder state.
void Folder
