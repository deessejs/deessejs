"use client"

import { useEffect, useState } from "react"
import {
  ArrowUp,
  Globe,
  Image as ImageIcon,
  Paperclip,
  Plus,
  Telescope,
} from "lucide-react"
import {
  LazyMotion,
  domAnimation,
  useReducedMotion,
  type Variants,
} from "motion/react"
import * as m from "motion/react-m"
import { MessageScroller } from "@shadcn/react/message-scroller"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import {
  Bubble,
  BubbleContent,
} from "@workspace/ui/components/bubble"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@workspace/ui/components/input-group"
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
 * Surface override applied to every Bubble in the thread so the chat
 * reads as a monochrome conversation. Both user and agent bubbles
 * use `bg-background` (the variant's slot selector lets the consumer
 * className win the cascade), with `border-border` for the same
 * shared-border rhythm the rest of the homepage uses.
 *
 * `max-w-none` on the wrapper Bubble lets the bubble span the
 * message column beyond the variant's 80% clamp.
 */
const BUBBLE_CLASS = "max-w-none"
const BUBBLE_CONTENT_CLASS = "bg-background border-border"

/**
 * User avatar — a 1-letter initial drawn from a casual first name.
 * The `bg-muted` chrome comes from the Avatar primitive's default
 * `AvatarFallback`; the `text-foreground` ink is the default
 * `text-muted-foreground` inverted to foreground so the initial
 * reads on the muted background.
 */
function UserAvatar() {
  return (
    <Avatar className="bg-muted">
      <AvatarFallback className="bg-muted text-foreground text-label-12 font-medium">
        S
      </AvatarFallback>
    </Avatar>
  )
}

/**
 * Agent avatar — the Codex SVG logo (the agent's brand mark) on a
 * violet-tinted background. This is the ONLY violet accent in the
 * chat thread: the message bubbles themselves stay monochrome
 * (bg-background + border) so the conversation reads as a single
 * neutral surface. The avatar's violet chip is the role cue that
 * distinguishes user turns (avatar = initial "S", bg-muted) from
 * agent turns (avatar = Codex SVG, violet wash).
 */
function AgentAvatar() {
  return (
    <Avatar className="border border-violet-500/30 bg-violet-500/10">
      <AvatarFallback className="bg-violet-500/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/codex.svg"
          alt=""
          width={16}
          height={16}
          className="size-4 dark:invert"
          aria-hidden
        />
      </AvatarFallback>
    </Avatar>
  )
}

/**
 * Renders the typed-out prefix of `text` while it's streaming. When
 * `done` is true the full text is in place — no caret is appended.
 * The `done` flag stays in the type so the prop signature matches
 * the streaming state machine in the parent component, but we no
 * longer draw a caret (the vertical bar read as a stray "|" pipe
 * next to the text).
 */
function StreamedText({
  shown,
  done: _done,
}: {
  shown: string
  done: boolean
}) {
  return (
    <p className="whitespace-pre-line text-copy-13 leading-6 text-foreground">
      {shown}
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
        {/* Thread — wrapped in MessageScroller (shadcn) so the chat follows
            the canonical viewport + content + item contract. The user
            prompt rows carry scrollAnchor so the viewport re-anchors at
            the latest user message after each one renders. The agent
            rows stay anchored at the live edge via the Provider's
            defaultScrollPosition="end". */}
        <MessageScroller.Provider defaultScrollPosition="end">
          <MessageScroller.Root className="relative flex flex-1 flex-col">
              <MessageScroller.Viewport className="flex flex-1 flex-col overflow-y-auto">
                <MessageScroller.Content className="flex flex-1 flex-col gap-4">
                  {/* 1. User prompt */}
                  {show("user1") && (
                    <m.div variants={fadeIn}>
                      <Message align="end">
                        <MessageAvatar>
                          <UserAvatar />
                        </MessageAvatar>
                        <MessageContent>
                          <Bubble
                            variant="outline"
                            className={BUBBLE_CLASS}
                          >
                            <BubbleContent className={BUBBLE_CONTENT_CLASS}>
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
                          <AgentAvatar />
                        </MessageAvatar>
                        <MessageContent>
                          <Bubble
                            variant="outline"
                            className={BUBBLE_CLASS}
                          >
                            <BubbleContent className={BUBBLE_CONTENT_CLASS}>
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
                          <AgentAvatar />
                        </MessageAvatar>
                        <MessageContent>
                          <Bubble
                            variant="outline"
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
                        <MessageAvatar>
                          <UserAvatar />
                        </MessageAvatar>
                        <MessageContent>
                          <Bubble
                            variant="outline"
                            className={BUBBLE_CLASS}
                          >
                            <BubbleContent className={BUBBLE_CONTENT_CLASS}>
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
                          <AgentAvatar />
                        </MessageAvatar>
                        <MessageContent>
                          <Bubble
                            variant="outline"
                            className={BUBBLE_CLASS}
                          >
                            <BubbleContent className={BUBBLE_CONTENT_CLASS}>
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
                          <AgentAvatar />
                        </MessageAvatar>
                        <MessageContent>
                          <Bubble
                            variant="outline"
                            className={BUBBLE_CLASS}
                          >
                            <BubbleContent className={BUBBLE_CONTENT_CLASS}>
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
                </MessageScroller.Content>
              </MessageScroller.Viewport>
              {/* Jump-to-latest button — appears when scrolled up. Uses
                  inert to hide when at the live edge. */}
              <MessageScroller.Button className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-background px-3 py-1 text-sm font-medium inert:opacity-0">
                Jump to latest
              </MessageScroller.Button>
            </MessageScroller.Root>
          </MessageScroller.Provider>

        {/* Input bar — visual only (no submit, no focus, no keyboard).
            The shadcn InputGroup pattern: textarea + block-end addon
            with an Add-files DropdownMenu (left) and a Send button (right).
            All controls are pointer-events-none + tabIndex={-1} to keep the
            chat as a visual prop without a hydration mismatch on the
            HTML `disabled` attribute. */}
        <InputGroup className="mt-1 border-t border-border rounded-none bg-background">
          <InputGroupTextarea
            rows={1}
            readOnly
            placeholder="Ask your agent to do anything…"
            aria-label="Type a message to your coding agent (visual demo)"
            tabIndex={-1}
            className="cursor-default"
          />
          <InputGroupAddon align="block-end" className="pt-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InputGroupButton
                  aria-label="Add files"
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  tabIndex={-1}
                  className="pointer-events-none"
                >
                  <Plus aria-hidden />
                </InputGroupButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="top"
                className="w-44"
              >
                <DropdownMenuItem>
                  <Paperclip aria-hidden />
                  Add Photos & Files
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <ImageIcon aria-hidden />
                  Create Image
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Telescope aria-hidden />
                  Deep Research
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Globe aria-hidden />
                  Web Search
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <InputGroupButton
              type="submit"
              variant="default"
              size="icon-sm"
              tabIndex={-1}
              className="ml-auto pointer-events-none opacity-50"
              aria-label="Send message"
            >
              <ArrowUp aria-hidden />
              <span className="sr-only">Send</span>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </LazyMotion>
  )
}