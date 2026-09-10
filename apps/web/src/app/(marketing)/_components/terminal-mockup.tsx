"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@workspace/ui/lib/utils"

type TerminalLine = {
  prompt: string
  output?: string | string[]
}

const HELP_OUTPUT = [
  "Available commands:",
  "  init <name> --template=<slug>   Scaffold a new project",
  "  list                            Browse the registry",
  "  info <name>                     Show wired contracts for a project",
  "  help                            Show this help",
  "  clear                           Clear the terminal",
].join("\n")

const LIST_OUTPUT = [
  "saas-starter       shipped      Next.js · Better Auth · Drizzle · Stripe",
  "ai-chatbot         coming-soon AI agents · OpenAI · MCP",
  "landing-page       coming-soon Astro · Tailwind · shadcn",
  "cli-tool           coming-soon Standalone CLI templates",
  "mobile-app         coming-soon React Native · Expo · shared contracts",
  "desktop-app        coming-soon Electron · Tauri · shared backend",
  "blog-starter       coming-soon MDX · i18n · structured data",
  "ecommerce-store    coming-soon Stripe · inventory · webhooks",
].join("\n")

const INFO_OUTPUT = [
  "6 contracts wired · 0 missing · 0 outdated",
  "",
  "  ✔ auth       Better Auth + Drizzle adapter",
  "  ✔ database   Postgres (Drizzle, 12 tables)",
  "  ✔ billing    Stripe (subscriptions + webhooks)",
  "  ✔ jobs       Upstash QStash (retries, DLQ)",
  "  ✔ storage    Cloudflare R2 (signed URLs)",
  "  ✔ observability  Sentry + OpenTelemetry",
  "",
  "MCP server: ready · 12 tools exposed",
].join("\n")

const INIT_OUTPUT_LINES = [
  "Cloning template…",
  "Installing contracts (auth, db, billing, jobs, storage, obs)…",
  "Wiring Better Auth + Drizzle + Stripe…",
  "Generating AGENTS.md and MCP manifest…",
  "✔ Project ready at ./my-saas",
]

const INIT_TEMPLATE_NAMES: Record<string, string> = {
  "saas-starter": "saas-starter",
  "ai-chatbot": "ai-chatbot",
  "landing-page": "landing-page",
}

type CommandResult =
  | { kind: "output"; lines: string[] }
  | { kind: "async"; lines: string[]; delayMs: number }
  | { kind: "clear" }
  | { kind: "unknown"; cmd: string }

function runCommand(raw: string): CommandResult {
  const trimmed = raw.trim()
  if (!trimmed) return { kind: "output", lines: [] }

  const [cmd, ...rest] = trimmed.split(/\s+/)
  const arg = rest.join(" ")

  switch (cmd) {
    case "help":
      return { kind: "output", lines: HELP_OUTPUT.split("\n") }

    case "clear":
      return { kind: "clear" }

    case "list":
      return { kind: "output", lines: LIST_OUTPUT.split("\n") }

    case "info": {
      const projectName = arg || "my-saas"
      return {
        kind: "output",
        lines: INFO_OUTPUT.split("\n").map((l) =>
          l === "" ? "" : l,
        ),
      }
    }

    case "init": {
      const projectName = arg.match(/^(\S+)/)?.[1] || "my-saas"
      const templateMatch = arg.match(/--template=(\S+)/)
      const template = templateMatch
        ? INIT_TEMPLATE_NAMES[templateMatch[1]] || templateMatch[1]
        : "saas-starter"
      const lines = INIT_OUTPUT_LINES.map((l) =>
        l
          .replace("./my-saas", `./${projectName}`)
          .replace("saas-starter", template),
      )
      return { kind: "async", lines, delayMs: 800 }
    }

    default:
      return { kind: "unknown", cmd }
  }
}

const UNKNOWN_OUTPUT = (cmd: string) =>
  `command not found: ${cmd}\nType "help" for the list of available commands.`

export function TerminalMockup({
  lines: initialLines,
  label,
  className,
}: {
  lines: ReadonlyArray<TerminalLine>
  label: string
  /** Optional className applied to the inner scroll region for size tuning per call site. */
  className?: string
}) {
  const [history, setHistory] = useState<TerminalLine[]>(initialLines)
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history])

  const submit = (raw: string) => {
    const result = runCommand(raw)
    const echoedPrompt = `$ ${raw.trim()}`

    if (result.kind === "clear") {
      setHistory([])
      setInput("")
      return
    }

    if (result.kind === "unknown") {
      setHistory((h) => [
        ...h,
        { prompt: echoedPrompt, output: UNKNOWN_OUTPUT(result.cmd) },
      ])
      setInput("")
      return
    }

    if (result.kind === "output") {
      const lines = result.lines
      setHistory((h) => [
        ...h,
        { prompt: echoedPrompt, output: lines.join("\n") },
      ])
      setInput("")
      return
    }

    // async
    const placeholder: TerminalLine = {
      prompt: echoedPrompt,
      output: "…",
    }
    setHistory((h) => [...h, placeholder])
    setInput("")

    window.setTimeout(() => {
      setHistory((h) =>
        h.map((line, i) =>
          i === h.length - 1
            ? { ...line, output: result.lines.join("\n") }
            : line,
        ),
      )
    }, result.delayMs)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      submit(input)
    }
  }

  return (
    <div
      role="region"
      aria-label="DeesseJS terminal. Try a command."
      className="overflow-hidden rounded-lg border border-border bg-zinc-950 text-zinc-100 shadow-sm"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
        <span className="size-2.5 rounded-full bg-white/20" aria-hidden />
        <span className="size-2.5 rounded-full bg-white/20" aria-hidden />
        <span className="size-2.5 rounded-full bg-white/20" aria-hidden />
        <span className="ml-2 text-label-12 font-mono text-white/60">
          {label}
        </span>
      </div>
      <div
        ref={scrollRef}
        className={cn(
          "overflow-y-auto px-4 py-4 text-copy-13-mono leading-6 text-white/90 max-h-80",
          className,
        )}
      >
        {history.map((line, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-white whitespace-pre-wrap">
              {line.prompt}
            </span>
            {line.output ? (
              <span className="whitespace-pre-wrap text-white/70">
                {line.output}
              </span>
            ) : null}
          </div>
        ))}
        <div className="flex items-center gap-1">
          <span className="text-white">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            aria-label="Terminal input"
            className="flex-1 bg-transparent outline-none border-none text-white caret-white placeholder:text-white/30"
            placeholder="Type 'help' and press Enter"
          />
        </div>
      </div>
    </div>
  )
}
