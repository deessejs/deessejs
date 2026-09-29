"use client"

import * as m from "motion/react-m"
import { LazyMotion, domAnimation, useReducedMotion } from "motion/react"
import { File, Folder, FolderOpen, TerminalSquare } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

import {
  DEV_OUTPUT_LINE,
  INIT_OUTPUT_LINES,
  SAAS_STARTER_FILES,
  SAAS_STARTER_PACKAGE_JSON,
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
 *   • Editor    (top-right) : `package.json` snippet revealed with
 *                            a top-to-bottom clip-path animation.
 *   • Terminal  (bottom)    : shows the canonical `deessejs init`
 *                            command, then its real output, then
 *                            `pnpm dev` (a separate command —
 *                            `init` does NOT start the server).
 *
 * Choreography (plays once on viewport entry, ~4s total):
 *   t=0.0s   terminal prompt + command 1 starts typing
 *   t=0.6s   init output lines fade in
 *   t=1.4s   explorer nodes stagger in
 *   t=2.4s   editor reveals (clip-path top→bottom)
 *   t=2.6s   command 2 (`pnpm dev`) starts typing
 *   t=3.2s   dev output line appears
 *
 * `useReducedMotion` short-circuits to the static variant — the
 * panel still tells the same story, just instantly.
 *
 * Source-of-truth: `apps/cli/src/commands/init.ts` (clone +
 * detect PM + install), `apps/cli/src/commands/info.ts` (info
 * command, not used in this animation — see cli-in-action.tsx
 * for the post-init CTA). The template layout is a curated list
 * in `cli-workbench-data.ts`; update both in lockstep.
 */
export function CliWorkbench() {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <StaticWorkbench />
  }

  return (
    <LazyMotion features={domAnimation}>
      <AnimatedWorkbench />
    </LazyMotion>
  )
}

/**
 * Static variant — rendered as plain HTML for users with
 * `prefers-reduced-motion: reduce`. The workbench reads as an
 * IDE with a populated file tree, an open file, and a finished
 * terminal session.
 */
function StaticWorkbench() {
  return (
    <div
      role="img"
      aria-label="IDE workbench showing a populated saas-starter project: file tree, package.json editor, terminal session where deessejs init and pnpm dev have run."
      className="flex h-full flex-col overflow-hidden border border-border bg-background"
    >
      <div className="grid flex-1 grid-cols-[minmax(0,5fr)_minmax(0,7fr)] divide-x divide-border">
        <div className="flex flex-col gap-2 p-4">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Explorer
          </p>
          <div className="flex-1 overflow-hidden">
            <StaticExplorer
              node={SAAS_STARTER_FILES[0]!}
              depth={0}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Editor
            </p>
            <span className="font-mono text-label-12 text-muted-foreground">
              package.json
            </span>
          </div>
          <pre className="flex-1 overflow-auto rounded-none border border-border bg-background p-3 font-mono text-label-12 leading-relaxed text-foreground">
            {SAAS_STARTER_PACKAGE_JSON}
          </pre>
        </div>
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

function AnimatedWorkbench() {
  return (
    <div
      role="img"
      aria-label="IDE workbench: a file tree fills as the CLI clones the saas-starter template, then pnpm dev starts the dev server."
      className="flex h-full flex-col overflow-hidden border border-border bg-background"
    >
      {/* Top row: Explorer + Editor */}
      <div className="grid flex-1 grid-cols-[minmax(0,5fr)_minmax(0,7fr)] divide-x divide-border">
        <ExplorerPane />
        <EditorPane />
      </div>

      {/* Bottom row: Terminal */}
      <TerminalPane />
    </div>
  )
}

// ----------------------------------------------------------------------
// Explorer pane (animated)
// ----------------------------------------------------------------------

function ExplorerPane() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
        Explorer
      </p>
      <div className="flex-1 overflow-hidden">
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
  // Top-level folder appears first, then leaves, then nested
  // children. The stagger makes the tree feel like a clone
  // (~150ms between siblings).
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

// ----------------------------------------------------------------------
// Editor pane (animated)
// ----------------------------------------------------------------------

function EditorPane() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Editor
        </p>
        <span className="font-mono text-label-12 text-muted-foreground">
          package.json
        </span>
      </div>
      <m.pre
        initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
        whileInView={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{
          duration: 0.6,
          delay: 2.4,
          ease: [0.16, 1, 0.3, 1] as const,
        }}
        className="flex-1 overflow-auto rounded-none border border-border bg-background p-3 font-mono text-label-12 leading-relaxed text-foreground"
      >
        {SAAS_STARTER_PACKAGE_JSON}
      </m.pre>
    </div>
  )
}

// ----------------------------------------------------------------------
// Terminal pane (animated)
// ----------------------------------------------------------------------

function TerminalPane() {
  return (
    <div className="flex flex-col gap-2 border-t border-border p-4">
      <p className="flex items-center gap-1.5 text-label-13 uppercase tracking-wider text-muted-foreground">
        <TerminalSquare aria-hidden className="size-3" />
        Terminal
      </p>
      <div className="flex flex-col gap-1 overflow-hidden font-mono text-label-13 leading-relaxed text-foreground">
        {/* Command 1: init */}
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

// `Folder` is imported but only FolderOpen is used; suppress the
// unused-import warning in case a future caller wants the closed
// folder state.
void Folder
