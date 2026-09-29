"use client"

import { useEffect, useState } from "react"
import { Send } from "lucide-react"
import {
  LazyMotion,
  domAnimation,
  useReducedMotion,
  type Variants,
} from "motion/react"
import * as m from "motion/react-m"

import { Button } from "@workspace/ui/components/button"
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
 * Real-feel chat interface shown on the homepage CodingAgents section.
 *
 * Six turns tell the "any coding agent runs the CLI for you" story in
 * two passes:
 *   1. user   — instant. "Initialize a saas-starter template…"
 *   2. agent  — streamed. "Reading the registry… here's the plan…"
 *   3. agent  — tool-call card. 4 monospace lines stagger in.
 *   4. user   — instant. "Now add observability to it."
 *   5. agent  — streamed. "Setting up the observability contract…"
 *   6. agent  — streamed. Final reply.
 *
 * No wrapping card: the thread sits on the section background, the
 * way a real chat surface does. A disabled input bar (textarea + send
 * button) anchors the bottom — `border-t` separates it from the
 * thread, no card chrome.
 *
 * Mirrors the streaming recipe at
 * `apps/web/src/app/(product)/use-cases/_components/mockups/streaming-chat.tsx`
 * (recursive setTimeout + state slice) but composes the conversation
 * through the new shadcn `Bubble` + `Message` primitives.
 *
 * `useReducedMotion()` short-circuits the entire timer chain — every
 * message renders with full text immediately, no per-line stagger.
 */

const TYPING_SPEED_MS = 28

/** Conversation turns. */
const USER_PROMPT_1 = "Initialize a saas-starter template from the registry."

const AGENT_PLAN =
  "Reading the registry… Detecting your package manager.\n\nHere's the plan:\n1. Clone the template repo\n2. Detect your package manager\n3. Install dependencies"

const TOOL_CALL_LINES = [
  "▸ $ deessejs init saas-starter",
  "✔ Cloned into ./saas-starter",
  "✔ Detected package manager: pnpm",
  "✔ Installed 487 packages",
] as const

const USER_PROMPT_2 = "Now add observability to it."

const AGENT_OBSERVABILITY =
  "Setting up the observability contract…\nInitialised Drizzle adapter, traces + logs + metrics.\nWiring Sentry to Next.js and Better Stack to dashboards."

const AGENT_DONE = "Project ready. Run `pnpm dev` to start the server."

/** Per-message timing budget (ms). Total ≈ 7s end-to-end. */
const TIMING = {
  user1: 150,
  agent1Start: 600,
  toolStart: 1800,
  toolLineStep: 0.15,
  user2: 3400,
  agent2Start: 3800,
  agent3Start: 5800,
} as const

type Phase = "pending" | "streaming" | "done"

type TurnKey =
  | "user1"
  | "agent1"
  | "tool"
  | "user2"
  | "agent2"
  | "agent3"

const ALL_TURNS: ReadonlyArray<TurnKey> = [
  "user1",
  "agent1",
  "tool",
  "user2",
  "agent2",
  "agent3",
]

/**
 * Visual variant the agent bubbles use. `tinted` is the
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
 *
 * Renders newlines as `<br />` so multi-line agent text wraps cleanly
 * inside the bubble without breaking the inline text rhythm.
 */
function StreamedText({
  shown,
  done,
}: {
  shown: string
  done: boolean
}) {
  return (
    <p className="whitespace-pre-line text-copy-13 leading-6 text-foreground">
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

  const [phases, setPhases] = useState<Record<TurnKey, Phase>>({
    user1: "pending",
    agent1: "pending",
    tool: "pending",
    user2: "pending",
    agent2: "pending",
    agent3: "pending",
  })
  const [agent1Shown, setAgent1Shown] = useState("")
  const [agent2Shown, setAgent2Shown] = useState("")
  const [agent3Shown, setAgent3Shown] = useState("")

  useEffect(() => {
    let cancelled = false
    const streamCancels: Array<() => void> = []
    const toolTimers: Array<number> = []

    const safe = (fn: () => void) => {
      if (cancelled) return
      fn()
    }

    const markDone = (key: TurnKey) =>
      safe(() =>
        setPhases((p) => (p[key] === "pending" ? { ...p, [key]: "done" } : p)),
      )

    const markStreaming = (key: TurnKey) =>
      safe(() =>
        setPhases((p) =>
          p[key] === "pending" ? { ...p, [key]: "streaming" } : p,
        ),
      )

    // All instant user turns render immediately.
    markDone("user1")

    if (reduceMotion) {
      // Bypass the streaming chain entirely.
      safe(() => {
        setAgent1Shown(AGENT_PLAN)
        setAgent2Shown(AGENT_OBSERVABILITY)
        setAgent3Shown(AGENT_DONE)
        setPhases({
          user1: "done",
          agent1: "done",
          tool: "done",
          user2: "done",
          agent2: "done",
          agent3: "done",
        })
      })
      return () => {
        cancelled = true
      }
    }

    // Agent 1 — streamed plan after a short beat.
    const agent1Timer = window.setTimeout(() => {
      markStreaming("agent1")
      streamCancels.push(
        streamText({
          text: AGENT_PLAN,
          speedMs: TYPING_SPEED_MS,
          setShown: (s) => safe(() => setAgent1Shown(s)),
        }),
      )
    }, TIMING.agent1Start)

    // Tool-call card — 4 lines stagger in.
    for (let i = 0; i < TOOL_CALL_LINES.length; i++) {
      const t = window.setTimeout(() => {
        if (i === 0) markStreaming("tool")
      }, TIMING.toolStart + i * TIMING.toolLineStep * 1000)
      toolTimers.push(t)
    }
    const toolDone = window.setTimeout(
      () => markDone("tool"),
      TIMING.toolStart +
        (TOOL_CALL_LINES.length - 1) * TIMING.toolLineStep * 1000 +
        250,
    )
    toolTimers.push(toolDone)

    // User 2 — instant follow-up after the tool finishes.
    const user2Timer = window.setTimeout(() => markDone("user2"), TIMING.user2)
    toolTimers.push(user2Timer)

    // Agent 2 — streamed observability summary.
    const agent2Timer = window.setTimeout(() => {
      markStreaming("agent2")
      streamCancels.push(
        streamText({
          text: AGENT_OBSERVABILITY,
          speedMs: TYPING_SPEED_MS,
          setShown: (s) => safe(() => setAgent2Shown(s)),
        }),
      )
    }, TIMING.agent2Start)

    // Agent 3 — short final reply.
    const agent3Timer = window.setTimeout(() => {
      markStreaming("agent3")
      streamCancels.push(
        streamText({
          text: AGENT_DONE,
          speedMs: TYPING_SPEED_MS,
          setShown: (s) => safe(() => setAgent3Shown(s)),
        }),
      )
    }, TIMING.agent3Start)

    return () => {
      cancelled = true
      ;[agent1Timer, agent2Timer, agent3Timer].forEach((t) =>
        window.clearTimeout(t),
      )
      toolTimers.forEach((t) => window.clearTimeout(t))
      streamCancels.forEach((cancel) => cancel())
    }
  }, [reduceMotion])

  const show = (key: TurnKey) => phases[key] !== "pending"

  return (
    <LazyMotion features={domAnimation}>
      <div
        role="img"
        aria-label="Chat thread: a user asks a coding agent to initialize the saas-starter template, the agent reads the registry, runs deessejs init, then the user asks to add observability and the agent wires it up. The thread ends with a disabled input field."
        className="flex h-full flex-col gap-4 text-copy-13 leading-6 text-foreground"
      >
        {/* Thread */}
        <m.div
          data-slot="chat-thread"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="flex flex-1 flex-col gap-4 overflow-y-auto"
        >
          {/* 1. User prompt */}
          {show("user1") && (
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
                        {USER_PROMPT_1}
                      </p>
                    </BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            </m.div>
          )}

          {/* 2. Agent plan */}
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

          {/* 4. User follow-up */}
          {show("user2") && (
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
                        {USER_PROMPT_2}
                      </p>
                    </BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            </m.div>
          )}

          {/* 5. Agent observability */}
          {show("agent2") && (
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
                        shown={agent2Shown}
                        done={phases.agent2 === "done"}
                      />
                    </BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            </m.div>
          )}

          {/* 6. Agent final */}
          {show("agent3") && (
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
                        shown={agent3Shown}
                        done={phases.agent3 === "done"}
                      />
                    </BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            </m.div>
          )}
        </m.div>

        {/* Input bar — disabled, separated from the thread by a border-t */}
        <div className="flex items-end gap-2 border-t border-border px-1 pt-3">
          <textarea
            disabled
            rows={1}
            placeholder="Ask your agent to do anything…"
            aria-label="Type a message to your coding agent (visual demo, input is disabled)"
            className="flex-1 resize-none border-0 bg-transparent text-copy-13 leading-6 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 disabled:cursor-default"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Send message"
            disabled
            className="size-7 shrink-0 text-muted-foreground"
          >
            <Send className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
    </LazyMotion>
  )
}