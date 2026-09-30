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
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { MessageScroller } from "@shadcn/react/message-scroller"

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
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

/**
 * Scenario-driven demo for the CodingAgents homepage section.
 *
 * The chat on the left and the accordion stack on the right are
 * driven by a single `activeIndex`. On each scenario change the
 * chat renders the entire conversation at once (no per-message
 * typing chain) and the accordion stack swaps which rectangle is
 * "active" - the active rectangle's progress fill grows from 0 to
 * 100% over `CYCLE_MS`, then the index advances and the next
 * conversation takes over. The cycle loops 1 -> 2 -> 3 -> 1 ...
 * continuously, so a finished rectangle's bar returns to empty
 * while it waits for its next pass.
 *
 * Three design choices vs. the previous iteration:
 *
 * 1. CLI turns render as their own card, not as Message + Bubble.
 *    Same chrome as the rest of the section (border + bg-background)
 *    but a distinct visual treatment: a small "CLI . Command"
 *    header, the command in monospace, and the output lines below
 *    with checkmarks. The user + agent turns keep the shadcn
 *    Message + Bubble primitives.
 * 2. No per-message stagger. The whole conversation swaps in one
 *    AnimatePresence transition, so the chat reads as one cohesive
 *    script rather than three messages racing each other to type.
 * 3. The right column is a stack of scenario rectangles (gap-3)
 *    with a fill bar that grows over the cycle. The eyebrow + h2
 *    + lead sit above the stack; the stack itself is the
 *    "legend" the review asked for.
 *
 * `useReducedMotion()` short-circuits the auto-cycle; the first
 * scenario renders in full and the rectangles stop filling. The
 * AnimatePresence wrapper still swaps if the user clicks another
 * rectangle - accessibility is preserved without the timer.
 */

type MessageTurn = {
  id: string
  kind: "message"
  role: "user" | "agent"
  text: string
}

type CliTurn = {
  id: string
  kind: "cli"
  command: string
  output: ReadonlyArray<string>
}

type Turn = MessageTurn | CliTurn

type Scenario = {
  id: string
  title: string
  summary: string
  turns: ReadonlyArray<Turn>
}

const CYCLE_MS = 8000

const SCENARIOS: ReadonlyArray<Scenario> = [
  {
    id: "initialize",
    title: "Initialize a template",
    summary: "Start a project from the registry.",
    turns: [
      {
        id: "initialize-user-1",
        kind: "message",
        role: "user",
        text: "Initialize a saas-starter template from the registry.",
      },
      {
        id: "initialize-agent-1",
        kind: "message",
        role: "agent",
        text: "Reading the registry, detecting your package manager. Here's the plan: clone the template, detect your package manager, install dependencies.",
      },
      {
        id: "initialize-cli-1",
        kind: "cli",
        command: "deessejs init saas-starter",
        output: [
          "Cloned into ./saas-starter",
          "Detected package manager: pnpm",
          "Installed 487 packages",
        ],
      },
      {
        id: "initialize-agent-2",
        kind: "message",
        role: "agent",
        text: "Project ready. Run pnpm dev to start the server.",
      },
    ],
  },
  {
    id: "observability",
    title: "Add observability",
    summary: "Extend a project with a typed contract.",
    turns: [
      {
        id: "observability-user-1",
        kind: "message",
        role: "user",
        text: "Now add observability to it.",
      },
      {
        id: "observability-agent-1",
        kind: "message",
        role: "agent",
        text: "Setting up the observability contract. Initialised Drizzle adapter, traces + logs + metrics. Wiring Sentry to Next.js and Better Stack to dashboards.",
      },
      {
        id: "observability-cli-1",
        kind: "cli",
        command: "deessejs add observability",
        output: [
          "Added observability contract",
          "Configured Sentry for Next.js",
          "Added Better Stack dashboard",
        ],
      },
      {
        id: "observability-agent-2",
        kind: "message",
        role: "agent",
        text: "Observability is configured. The project is ready to run.",
      },
    ],
  },
  {
    id: "swap-contract",
    title: "Swap a contract",
    summary: "Replace a provider without rewriting callers.",
    turns: [
      {
        id: "swap-user-1",
        kind: "message",
        role: "user",
        text: "Swap the auth provider from Better Auth to Clerk.",
      },
      {
        id: "swap-agent-1",
        kind: "message",
        role: "agent",
        text: "Reading the auth contract. Verifying Clerk covers the same surface (sessions, organizations, invitations, OAuth). Wiring the Clerk adapter and updating AGENTS.md.",
      },
      {
        id: "swap-cli-1",
        kind: "cli",
        command: "deessejs swap auth --from better-auth --to clerk",
        output: [
          "Read auth contract from registry",
          "Replaced Better Auth adapter with Clerk",
          "Updated AGENTS.md and MCP manifest",
          "No call sites changed",
        ],
      },
      {
        id: "swap-agent-2",
        kind: "message",
        role: "agent",
        text: "Done. Sign-in, sessions, and orgs still work the same way from the call sites.",
      },
    ],
  },
]

const VERCEL_AVATAR_BASE = "https://vercel.com/api/www/avatar"
const VERCEL_AVATAR_DPL =
  "dpl_AS99V7XmtTzE4xdb72tYFtNTVV48" as const

function UserAvatar() {
  const handle = "sarah@example.com"
  const src = `${VERCEL_AVATAR_BASE}?s=64&u=${encodeURIComponent(handle)}&dpl=${VERCEL_AVATAR_DPL}`
  return (
    <Avatar className="bg-muted">
      <AvatarImage
        src={src}
        alt=""
        className="rounded-full dark:invert"
      />
      <AvatarFallback className="bg-muted text-label-12 text-muted-foreground">
        S
      </AvatarFallback>
    </Avatar>
  )
}

function AgentAvatar() {
  return (
    <Avatar className="bg-muted">
      <AvatarFallback className="bg-muted">
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

const BUBBLE_CLASS = "max-w-none"
const BUBBLE_CONTENT_CLASS = "bg-background border-border"

function ChatMessage({ turn }: { turn: MessageTurn }) {
  const isUser = turn.role === "user"

  return (
    <Message align={isUser ? "end" : "start"}>
      <MessageAvatar>
        {isUser ? <UserAvatar /> : <AgentAvatar />}
      </MessageAvatar>
      <MessageContent>
        <Bubble variant="outline" className={BUBBLE_CLASS}>
          <BubbleContent className={BUBBLE_CONTENT_CLASS}>
            <p className="text-copy-13 leading-6 text-foreground">
              {turn.text}
            </p>
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  )
}

function CliCard({ turn }: { turn: CliTurn }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="border-b border-border px-4 py-2">
        <p className="text-label-12 uppercase tracking-wider text-muted-foreground">
          CLI &middot; Command
        </p>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-copy-12 leading-6 text-foreground">
        <code>$ {turn.command}</code>
      </pre>
      <ul className="flex flex-col gap-1 border-t border-border px-4 py-3 font-mono text-label-12 leading-6">
        {turn.output.map((line) => (
          <li
            key={line}
            className="text-emerald-600 dark:text-emerald-400"
          >
            &#10003; {line}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CodingAgentsDemo() {
  const reduceMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (reduceMotion) return

    const startedAt = performance.now()
    const intervalId = window.setInterval(() => {
      const elapsed = performance.now() - startedAt
      const next = Math.min(elapsed / CYCLE_MS, 1)
      setProgress(next)
      if (next >= 1) {
        window.clearInterval(intervalId)
        setActiveIndex((index) => (index + 1) % SCENARIOS.length)
      }
    }, 50)

    return () => window.clearInterval(intervalId)
  }, [activeIndex, reduceMotion])

  const scenario = SCENARIOS[activeIndex] ?? SCENARIOS[0]!

  function selectScenario(index: number) {
    setActiveIndex(index)
    setProgress(0)
  }

  return (
    <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
      <div
        role="img"
        aria-label={`Chat thread showing the ${scenario.title} scenario.`}
        className="flex h-full flex-col gap-4 p-4 lg:p-6 text-copy-13 leading-6 text-foreground"
      >
        <MessageScroller.Provider defaultScrollPosition="end">
          <MessageScroller.Root className="relative flex flex-1 flex-col">
            <MessageScroller.Viewport className="flex flex-1 flex-col overflow-y-auto">
              <MessageScroller.Content className="flex flex-1 flex-col gap-4">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={scenario.id}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 8 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-4"
                  >
                    {scenario.turns.map((turn) =>
                      turn.kind === "cli" ? (
                        <CliCard key={turn.id} turn={turn} />
                      ) : (
                        <ChatMessage key={turn.id} turn={turn} />
                      ),
                    )}
                  </motion.div>
                </AnimatePresence>
              </MessageScroller.Content>
            </MessageScroller.Viewport>
            <MessageScroller.Button className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-background px-3 py-1 text-sm font-medium inert:opacity-0">
              Jump to latest
            </MessageScroller.Button>
          </MessageScroller.Root>
        </MessageScroller.Provider>

        <InputGroup className="mt-1 border-t border-border rounded-none bg-background">
          <InputGroupTextarea
            rows={1}
            readOnly
            placeholder="Ask your agent to do anything..."
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
                  Add Photos &amp; Files
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

      <div className="flex flex-col gap-5 p-6 lg:p-10">
        <div className="flex flex-col gap-3">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Coding agents
          </p>
          <h2 className="text-heading-32 font-medium tracking-tight text-balance lg:text-heading-48">
            Works with any coding agent.
          </h2>
          <p className="text-copy-16 leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
            Every template ships with the contracts your coding agent reads,
            typed at every boundary, AGENTS.md at the monorepo root, an MCP
            manifest for the tools. Pick the CLI; the contracts stay the same.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Coding agent scenarios"
          aria-orientation="vertical"
          className="flex flex-col gap-3"
        >
          {SCENARIOS.map((item, index) => {
            const isActive = index === activeIndex
            // The cycle loops 1 -> 2 -> 3 -> 1 -> ... continuously, so
            // only the active rectangle fills; the others stay empty
            // while they wait for their next pass.
            const fill = isActive ? progress : 0

            return (
              <Button
                key={item.id}
                type="button"
                role="tab"
                variant="ghost"
                aria-selected={isActive}
                onClick={() => selectScenario(index)}
                className="h-auto w-full overflow-hidden rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <span className="text-copy-14 font-medium text-foreground">
                  {item.title}
                </span>
                <p className="mt-1 text-copy-13 text-muted-foreground">
                  {item.summary}
                </p>
                <span
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={1}
                  aria-valuenow={isActive ? fill : 0}
                  className="mt-4 block h-1.5 overflow-hidden rounded-full bg-border"
                >
                  <span
                    className="block h-full origin-left bg-foreground transition-transform duration-75 ease-linear"
                    style={{ transform: `scaleX(${fill})` }}
                  />
                </span>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
