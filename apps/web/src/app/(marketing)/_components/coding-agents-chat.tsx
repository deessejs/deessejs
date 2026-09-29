"use client"

import { useEffect, useState } from "react"
import {
  LazyMotion,
  domAnimation,
  useReducedMotion,
  type Variants,
} from "motion/react"
import * as m from "motion/react-m"

import {
  Bubble,
  BubbleContent,
} from "@workspace/ui/components/bubble"
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@workspace/ui/components/message"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Chat-style mockup shown on the homepage CodingAgents section.
 *
 * Tells the "any coding agent can init a template" story in four
 * turns:
 *   1. user   — instant. "Initialize a saas-starter template…"
 *   2. agent  — streamed. "Reading the registry…"
 *   3. agent  — tool-call card. 4 monospace lines stagger in.
 *   4. agent  — streamed. "Project is ready at ./saas-starter…"
 *
 * Mirrors the recipe at
 * `apps/web/src/app/(product)/use-cases/_components/mockups/streaming-chat.tsx`
 * (recursive setTimeout + state slice) but composes the conversation
 * through the new shadcn `Bubble` + `Message` primitives. Single
 * useEffect schedules all four phases with absolute timestamps so
 * later messages wait for earlier ones to settle.
 *
 * Trigger: `whileInView` once. `MotionConfig reducedMotion="user"`
 * at the root degrades the per-line stagger; `useReducedMotion()`
 * additionally short-circuits the streaming timer chain — each
 * message renders its full text immediately.
 *
 * Color discipline: only the violet dot marker and the agent
 * bubble tint carry color. Everything else stays in the
 * monochrome `foreground` / `muted-foreground` palette used by
 * the rest of the homepage.
 */

const USER_PROMPT = "Initialize a saas-starter template from the registry."

const AGENT_READING = "Reading the registry… Detecting your package manager."

const TOOL_CALL_LINES = [
  "▸ $ deessejs init saas-starter",
  "✔ Cloned into ./saas-starter",
  "✔ Detected package manager: pnpm",
  "✔ Installed 487 packages",
] as const

const AGENT_DONE = "Project is ready at ./saas-starter. Run pnpm dev to start."

const TYPING_SPEED_MS = 28

/** Per-message timing budget (ms). Total ≈ 3.4s end-to-end. */
const TIMING = {
  /** Delay before the first agent message starts streaming. */
  agent1Start: 400,
  /** Approx duration to type AGENT_READING (~46 chars × 28 ms). */
  agent1Duration: AGENT_READING.length * TYPING_SPEED_MS,
  /** Delay before the tool-call card lines start staggering in. */
  toolCardStart: 1100,
  /** Delay between consecutive tool-call lines (s). */
  toolLineStep: 0.15,
  /** Delay before the final agent message starts streaming. */
  agent4Start: 2000,
} as const

type Phase = "pending" | "streaming" | "done"

type SlotKey = "user" | "agent1" | "tool" | "agent4"

const ALL_SLOTS: ReadonlyArray<SlotKey> = ["user", "agent1", "tool", "agent4"]

/**
 * Visual variants the agent bubbles use. `tinted` is the
 * shadcn-default variant; we override its surface with a
 * translucent violet wash via className so the accent reads
 * without minting a new design-system token.
 */
const AGENT_BUBBLE_CLASS =
  "max-w-none bg-violet-500/5 ring-violet-500/30 text-foreground"

/** Single-accent dot marker placed in each agent MessageAvatar slot. */
function AgentDot() {
  return (
    <span
      aria-hidden
      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-500 dark:bg-violet-400"
    />
  )
}

/** Caret span the streaming agent message renders at its tail. */
function Caret() {
  return (
    <span
      aria-hidden
      className="ml-px inline-block h-3 w-px animate-pulse bg-violet-500 align-middle"
    />
  )
}

/**
 * Renders the typed-out prefix of `text` followed by the streaming
 * caret. When `done` is true the caret is omitted — the message is
 * complete.
 */
function StreamedText({
  shown,
  done,
}: {
  shown: string
  done: boolean
}) {
  return (
    <p className="text-copy-13 leading-6 text-foreground">
      {shown}
      {done ? null : <Caret />}
    </p>
  )
}

/**
 * Drive a single message's stream: schedule `text.length * speedMs`
 * of setTimeout chain and resolve to the full text. Returns a
 * cancel fn for useEffect cleanup.
 */
function streamText({
  text,
  speedMs,
  setShown,
}: {
  text: string
  speedMs: number
  setShown: (s: string) => void
}): () => void {
  let cancelled = false
  let timer: number | undefined
  const tick = (i: number) => {
    if (cancelled) return
    setShown(text.slice(0, i))
    if (i <= text.length) {
      timer = window.setTimeout(() => tick(i + 1), speedMs)
    }
  }
  timer = window.setTimeout(() => tick(0), 0)
  return () => {
    cancelled = true
    if (timer !== undefined) window.clearTimeout(timer)
  }
}

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

export function CodingAgentsChat() {
  const reduceMotion = useReducedMotion()

  // Per-slot state. The two streamed messages also track a `shown`
  // string; the tool-call card tracks per-line visibility via the
  // phase alone (lines are revealed by the staggered m.li).
  const [phases, setPhases] = useState<Record<SlotKey, Phase>>({
    user: "pending",
    agent1: "pending",
    tool: "pending",
    agent4: "pending",
  })
  const [agent1Shown, setAgent1Shown] = useState("")
  const [agent4Shown, setAgent4Shown] = useState("")

  useEffect(() => {
    let cancelled = false
    let agent1Cancel: (() => void) | undefined
    let agent4Cancel: (() => void) | undefined
    const toolTimers: Array<number> = []

    const safe = (fn: () => void) => {
      if (cancelled) return
      fn()
    }

    // User prompt: instant.
    safe(() =>
      setPhases((p) => (p.user === "pending" ? { ...p, user: "done" } : p)),
    )

    if (reduceMotion) {
      // Bypass the streaming chain — every message appears with full
      // text immediately, no per-line stagger on the tool card.
      safe(() => {
        setAgent1Shown(AGENT_READING)
        setAgent4Shown(AGENT_DONE)
        setPhases({
          user: "done",
          agent1: "done",
          tool: "done",
          agent4: "done",
        })
      })
      return () => {
        cancelled = true
      }
    }

    // Agent message 1 — streamed after a 400 ms beat.
    const agent1Timer = window.setTimeout(() => {
      safe(() =>
        setPhases((p) =>
          p.agent1 === "pending" ? { ...p, agent1: "streaming" } : p,
        ),
      )
      agent1Cancel = streamText({
        text: AGENT_READING,
        speedMs: TYPING_SPEED_MS,
        setShown: (s) => safe(() => setAgent1Shown(s)),
      })
    }, TIMING.agent1Start)
    window.clearTimeout; // no-op, kept for symmetry with the cleanup below

    // Tool-call card — 4 lines stagger in starting at 1100 ms.
    const toolStart = TIMING.toolCardStart
    for (let i = 0; i < TOOL_CALL_LINES.length; i++) {
      const timer = window.setTimeout(() => {
        safe(() => {
          setPhases((p) =>
            p.tool === "pending" && i === 0 ? { ...p, tool: "streaming" } : p,
          )
        })
      }, toolStart + i * (TIMING.toolLineStep * 1000))
      toolTimers.push(timer)
    }
    // Mark tool done after the last line lands.
    const toolDone = window.setTimeout(
      () => safe(() => setPhases((p) => ({ ...p, tool: "done" }))),
      toolStart + (TOOL_CALL_LINES.length - 1) * (TIMING.toolLineStep * 1000) + 250,
    )
    toolTimers.push(toolDone)

    // Agent message 4 — streamed after 2000 ms.
    const agent4Timer = window.setTimeout(() => {
      safe(() =>
        setPhases((p) =>
          p.agent4 === "pending" ? { ...p, agent4: "streaming" } : p,
        ),
      )
      agent4Cancel = streamText({
        text: AGENT_DONE,
        speedMs: TYPING_SPEED_MS,
        setShown: (s) => safe(() => setAgent4Shown(s)),
      })
    }, TIMING.agent4Start)

    return () => {
      cancelled = true
      window.clearTimeout(agent1Timer)
      window.clearTimeout(agent4Timer)
      toolTimers.forEach((t) => window.clearTimeout(t))
      agent1Cancel?.()
      agent4Cancel?.()
    }
  }, [reduceMotion])

  const show = (slot: SlotKey, forceDone = false) =>
    phases[slot] !== "pending" || forceDone

  return (
    <LazyMotion features={domAnimation}>
      <div
        role="img"
        aria-label="Chat thread: a user asks a coding agent to initialize the saas-starter template. The agent reads the registry, runs deessejs init, and confirms the project is ready."
        className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 text-copy-13 leading-6 text-foreground lg:p-6"
      >
        {/* Header strip */}
        <div className="flex items-center justify-between text-label-12 uppercase tracking-wider text-muted-foreground">
          <span>Coding agent</span>
          <span className="font-mono text-label-12 text-violet-600 dark:text-violet-400">
            streaming
          </span>
        </div>

        {/* Thread */}
        <m.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="flex flex-col gap-3"
        >
          {/* 1. User prompt */}
          {show("user") && (
            <m.div variants={fadeIn}>
              <Message align="end">
                <MessageAvatar />
                <MessageContent>
                  <Bubble
                    variant="muted"
                    align="end"
                    className="max-w-none"
                  >
                    <BubbleContent>
                      <p className="text-copy-13 leading-6 text-foreground">
                        {USER_PROMPT}
                      </p>
                    </BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            </m.div>
          )}

          {/* 2. Agent reads the registry */}
          {show("agent1") && (
            <m.div variants={fadeIn}>
              <Message align="start">
                <MessageAvatar>
                  <AgentDot />
                </MessageAvatar>
                <MessageContent>
                  <Bubble
                    variant="tinted"
                    align="start"
                    className={AGENT_BUBBLE_CLASS}
                  >
                    <BubbleContent>
                      <StreamedText
                        shown={agent1Shown}
                        done={phases.agent1 === "done"}
                      />
                    </BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            </m.div>
          )}

          {/* 3. Tool-call card */}
          {show("tool") && (
            <m.div variants={fadeIn}>
              <Message align="start">
                <MessageAvatar>
                  <AgentDot />
                </MessageAvatar>
                <MessageContent>
                  <Bubble
                    variant="outline"
                    align="start"
                    className="max-w-none"
                  >
                    <BubbleContent>
                      <pre className="overflow-x-auto font-mono text-copy-12 leading-6 text-foreground">
                        {TOOL_CALL_LINES.map((line, i) => (
                          <m.span
                            key={i}
                            initial={{ opacity: 0, x: -4 }}
                            whileInView={{
                              opacity: 1,
                              x: 0,
                            }}
                            viewport={{ once: true }}
                            transition={{
                              duration: 0.25,
                              delay: i * TIMING.toolLineStep,
                              ease: "easeOut" as const,
                            }}
                            className={cn(
                              "block",
                              line.startsWith("▸") && "text-foreground",
                              line.startsWith("✔") &&
                                "text-emerald-600 dark:text-emerald-400",
                            )}
                          >
                            {line}
                          </m.span>
                        ))}
                      </pre>
                    </BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            </m.div>
          )}

          {/* 4. Agent confirms the project is ready */}
          {show("agent4") && (
            <m.div variants={fadeIn}>
              <Message align="start">
                <MessageAvatar>
                  <AgentDot />
                </MessageAvatar>
                <MessageContent>
                  <Bubble
                    variant="tinted"
                    align="start"
                    className={AGENT_BUBBLE_CLASS}
                  >
                    <BubbleContent>
                      <StreamedText
                        shown={agent4Shown}
                        done={phases.agent4 === "done"}
                      />
                    </BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            </m.div>
          )}
        </m.div>
      </div>
    </LazyMotion>
  )
}