"use client"

import { useEffect, useState } from "react"
import { AnimatePresence } from "motion/react"

/**
 * Animated Contracts grid for the marketing homepage.
 *
 * Lives in its own client component so the rest of the page can stay a
 * server component (KB guides, changelog, content-collections). Motion
 * needs the browser for its physics engine, so it can't run as an RSC.
 *
 * Animation layers, in order of when they fire:
 *   1. On viewport entry, the parent grid runs `staggerChildren` so the
 *      six cells fade + lift in left-to-right.
 *   2. Each cell has a `whileHover` lift (`y: -4`, `scale: 1.01`).
 *   3. The icon inside each cell rotates 8° on hover, inherited from the
 *      parent's hover state via variants.
 *   4. The mockup inside each cell runs its own per-kind animation and
 *      carries semantic colour:
 *      - auth-form       — macOS traffic-light dots (red/amber/green);
 *        everything else stays monochrome
 *      - db-terminal     — cyan `$` prompt, white command, emerald ✓
 *        success lines, zinc table list
 *      - billing-widget  — emerald usage bar fills 0 → 74% (1.2s ease)
 *      - jobs-trace      — emerald for ok, violet for running, red for
 *        error; the running row keeps its pulse
 *      - storage-browser — folder/PDF/image/archive icon colour
 *        cues at 60% opacity; row text stays monochrome
 *      - otel-waterfall  — parent progress bar is segmented by level
 *        (zinc/zinc/amber/red); the four sub-traces take the colour
 *        of their level (info = zinc muted, warn = amber, error = red)
 *
 * `MotionConfig reducedMotion="user"` lives in `apps/web/src/app/layout.tsx`
 * — users with the OS-level preference set get opacity-only animations.
 */

import * as motion from "motion/react-client"
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Check,
  CircleDollarSign,
  CloudUpload,
  Database,
  FileText,
  Folder,
  GitBranch,
  Image as ImageIcon,
  LineChart,
  Loader,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@workspace/ui/lib/utils"

type Provider = { name: string; logo: string }

/**
 * The contract's icon and mockup are passed as string identifiers from
 * the server-rendered page. Components cannot cross the RSC boundary,
 * so the icons are looked up via `ICON_MAP` here on the client.
 */
type Contract = {
  title: string
  description: string
  icon: "auth" | "database" | "billing" | "jobs" | "storage" | "observability"
  providers: ReadonlyArray<Provider>
  mockup:
    | "auth-form"
    | "db-terminal"
    | "billing-widget"
    | "jobs-trace"
    | "storage-browser"
    | "otel-waterfall"
}

const ICON_MAP = {
  auth: Zap,
  database: Database,
  billing: CircleDollarSign,
  jobs: GitBranch,
  storage: Boxes,
  observability: LineChart,
} as const

// Variant set shared by the parent grid and every cell. Variants are
// inherited via the `variants` prop, so the parent's `staggerChildren`
// runs without per-cell wiring.
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const cell = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function ContractsGrid({
  contracts,
}: {
  contracts: ReadonlyArray<Contract>
}) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-border"
    >
      {contracts.map((contract) => {
        const Icon = ICON_MAP[contract.icon]
        return (
          <motion.article
            key={contract.title}
            variants={cell}
            initial="rest"
            whileHover="hover"
            animate="rest"
            className="group relative flex flex-col gap-4 p-6"
          >
            {/* Ghost overlay — entire cell surface is a link to the
                same destination. Sits at z-0 so the content layer can
                stack above it. The corner button at z-20 also sits
                above, so the corner target wins when both overlap. */}
            <Link
              href={`/templates?tags=["${contract.title.toLowerCase()}"]`}
              aria-label={`Browse all ${contract.title} templates`}
              className="absolute inset-0 z-0"
            />
            {/* Corner button — same destination, but opens in a new
                tab so the user can keep the homepage open. Stacks
                above both the ghost link and the content. */}
            <Link
              href={`/templates?tags=["${contract.title.toLowerCase()}"]`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${contract.title} templates in a new tab`}
              className="absolute top-0 right-0 z-20 flex size-9 items-center justify-center border-l border-b border-border text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none"
            >
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
            {/* Content layer — sits above the ghost link so cards
                remain clickable but the mockup / text / chips stay
                readable and selectable. */}
            <div className="relative z-10 flex flex-col gap-4 pr-14">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md border border-border bg-muted/40">
                  <Icon className="text-foreground size-4" aria-hidden />
                </span>
                <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                  {contract.title}
                </h3>
              </div>

              <div className="rounded-md border border-border bg-background overflow-hidden">
                <ContractMockup kind={contract.mockup} />
              </div>

              <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
                {contract.description}
              </p>

              <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
                {contract.providers.map((provider) => (
                  <li
                    key={provider.name}
                    className="inline-flex items-center gap-1.5 text-label-12 text-muted-foreground"
                  >
                    {provider.logo.endsWith("-missing") ? null : (
                      // Plain <img> — see the ContractsGrid note in
                      // apps/web/src/app/(marketing)/page.tsx for why next/image
                      // is not used.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/logos/${provider.logo}.svg`}
                        alt=""
                        width={12}
                        height={12}
                        className="size-3 shrink-0 dark:invert"
                        aria-hidden
                      />
                    )}
                    {provider.name}
                  </li>
                ))}
              </ul>
            </div>
          </motion.article>
        )
      })}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Animated mockups — one per contract kind
// ---------------------------------------------------------------------------

/**
 * Three-phase authentication flow: form → loading → success.
 *
 *   1. form    — email + password fill in, Continue button appears
 *   2. loading — form fades, spinner + "Signing in…" appears
 *   3. success — avatar + "Welcome back" + green check
 *
 * The phase progresses on a setTimeout schedule once the cell has
 * entered the viewport (viewport={{ once: true }} on the parent
 * grid handles the trigger). Phase transitions are sequenced with
 * AnimatePresence mode="wait" so one view fully exits before the
 * next enters — no overlap.
 *
 * Colour discipline: only the macOS traffic-light dots and the
 * final success check carry colour. Everything else stays
 * monochrome, matching the rest of the home.
 */
type AuthPhase = "form" | "loading" | "success"

/** Per-character typing speed for the Auth fields (ms / char). */
const TYPING_SPEED_MS = 100

/** How long the loading state stays before flipping to success. */
const LOADING_MS = 1400

/** How long the filled form sits before the auto-submit fires.
 *  Must be at least the full password typing duration (startMs +
 *  text.length × speedMs) plus a small breath. With the current
 *  1100ms password start and 9-char password at 100ms/char, the
 *  last char lands at 1100 + 9*100 = 2000ms; we round up to
 *  2300ms. */
const FORM_HOLD_MS = 2300

function AuthFlowMockup() {
  const [phase, setPhase] = useState<AuthPhase>("form")

  useEffect(() => {
    const formTimer = window.setTimeout(() => setPhase("loading"), FORM_HOLD_MS)
    const loadingTimer = window.setTimeout(
      () => setPhase("success"),
      FORM_HOLD_MS + LOADING_MS,
    )
    return () => {
      window.clearTimeout(formTimer)
      window.clearTimeout(loadingTimer)
    }
  }, [])

  return (
    <div className="p-3">
      {/* Window chrome stays mounted through all phases so the
          "this is a browser" framing is consistent. */}
      <div className="mb-2 flex items-center gap-1.5 border-b border-border pb-1.5">
        <span className="size-2 rounded-full bg-red-500" aria-hidden />
        <span className="size-2 rounded-full bg-amber-500" aria-hidden />
        <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
        <span className="ml-1 font-mono text-[10px] text-muted-foreground/70">
          sign-in
        </span>
      </div>

      <div className="relative flex h-[88px] items-center justify-center p-1.5">
        <AnimatePresence mode="wait" initial={false}>
          {phase === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-x-1.5 inset-y-0 flex flex-col gap-2 justify-center"
            >
              <TypingField
                label="email"
                text="sarah@acme.io"
                startMs={300}
              />
              <TypingField
                label="password"
                text="hunter22!"
                mask
                startMs={1100}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.85, duration: 0.3 }}
                className="mt-1 flex items-center justify-end"
              >
                <span className="rounded-sm border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] text-zinc-100">
                  Continue →
                </span>
              </motion.div>
            </motion.div>
          )}
          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-x-1.5 inset-y-0 flex flex-col items-center justify-center gap-2"
            >
              <Loader
                className="size-4 animate-spin text-foreground"
                aria-hidden
              />
              <span className="font-mono text-[10px] text-muted-foreground">
                Signing in…
              </span>
            </motion.div>
          )}
          {phase === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-1.5 inset-y-0 flex items-center justify-center gap-2"
            >
              <span
                aria-hidden
                className="flex size-6 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15"
              >
                <Check
                  className="size-3 text-emerald-500"
                  strokeWidth={3}
                  aria-hidden
                />
              </span>
              <span className="font-mono text-[10px] text-foreground">
                Authenticated
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/**
 * A form field that types its content character-by-character on mount.
 *
 * For the password field we keep the masking convention: `text` holds
 * the real string but the rendered characters are `●`. This way the
 * typing animation still shows progress without ever revealing the
 * secret.
 *
 * Speed (60ms/char) lands in the "human typing" zone — fast enough
 * to keep the cell moving, slow enough that the eye can follow
 * each character landing. The blinking cursor sits at the end of
 * the typed string and stays visible for the lifetime of the field
 * (AnimatePresence tears the field down on phase change).
 */
function TypingField({
  label,
  text,
  mask = false,
  startMs,
  speedMs = TYPING_SPEED_MS,
}: {
  label: string
  text: string
  mask?: boolean
  startMs: number
  speedMs?: number
}) {
  const [shown, setShown] = useState("")

  useEffect(() => {
    // Recursive setTimeout instead of setInterval — easier to cancel
    // cleanly, no risk of overlapping fires if a tab was throttled,
    // and the last character still lands at the right time.
    let cancelled = false
    let timer: number | undefined

    const tick = (i: number) => {
      if (cancelled) return
      setShown(mask ? "●".repeat(i) : text.slice(0, i))
      if (i < text.length) {
        timer = window.setTimeout(() => tick(i + 1), speedMs)
      }
    }

    timer = window.setTimeout(() => tick(1), startMs)

    return () => {
      cancelled = true
      if (timer !== undefined) {
        window.clearTimeout(timer)
      }
    }
  }, [text, mask, startMs, speedMs])

  return (
    <div className="flex items-center gap-2 rounded-sm border border-border bg-background px-2 py-1">
      <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
      <span className="ml-auto flex max-w-[60%] items-center gap-0.5 overflow-hidden whitespace-nowrap font-mono text-[11px] text-foreground/90">
        <span>{shown}</span>
        <span
          aria-hidden
          className="inline-block h-3 w-px animate-pulse bg-foreground/70"
        />
      </span>
    </div>
  )
}

/**
 * Two `$` lines type out character-by-character; on completion a third
 * "tables" line fades in.
 *
 * Colours (terminal colour scheme, fixed regardless of theme):
 *   - prompt `$`  → cyan
 *   - command     → white
 *   - success ✓   → emerald
 *   - table list  → zinc-400 (muted)
 */
function DbTerminalMockup() {
  const line1 = "$ drizzle-kit generate"
  const line1Out = "✓ 4 schemas generated"
  const line2 = "$ drizzle-kit migrate"
  const line2Out = "✓ 12 tables created"
  const line3 = "users · orgs · sessions · invoices ..."

  return (
    <div className="bg-zinc-950 p-3 font-mono text-[11px] leading-5">
      <TypedLine
        segments={[
          { text: "$ ", color: "text-cyan-400" },
          { text: "drizzle-kit generate", color: "text-zinc-100" },
        ]}
        delay={0.05}
      />
      <TypedLine
        segments={[{ text: line1Out, color: "text-emerald-400" }]}
        delay={0.05 + line1.length * 0.025 + 0.1}
      />
      <TypedLine
        segments={[
          { text: "$ ", color: "text-cyan-400" },
          { text: "drizzle-kit migrate", color: "text-zinc-100" },
        ]}
        delay={0.05 + line1.length * 0.025 + 0.35}
      />
      <TypedLine
        segments={[{ text: line2Out, color: "text-emerald-400" }]}
        delay={
          0.05 + line1.length * 0.025 + 0.35 + line2.length * 0.025 + 0.1
        }
      />
      <motion.p
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          delay:
            0.05 +
            line1.length * 0.025 +
            0.35 +
            line2.length * 0.025 +
            0.35,
          duration: 0.35,
        }}
        className="text-zinc-400"
      >
        {line3}
      </motion.p>
    </div>
  )
}

function TypedLine({
  segments,
  delay,
}: {
  segments: ReadonlyArray<{ text: string; color: string }>
  delay: number
}) {
  return (
    <p>
      {segments.map((seg, segIdx) => (
        <span key={segIdx} className={seg.color}>
          {seg.text.split("").map((char, i) => (
            <motion.span
              key={`${segIdx}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + i * 0.025, duration: 0.05 }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </p>
  )
}

/**
 * Usage bar fills from 0 to 74% on mount. The percentage label counts
 * up at the same time using a simple `useMotionValue` -> animated span.
 */
function BillingWidgetMockup() {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] text-muted-foreground">
          Pro Plan
        </span>
        <span className="font-mono text-[11px] text-foreground">$49/mo</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            aria-hidden
            initial={{ width: 0 }}
            whileInView={{ width: "74%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-emerald-500"
          />
        </div>
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.0, duration: 0.3 }}
          className="font-mono text-[10px] text-muted-foreground"
        >
          74%
        </motion.span>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.1, duration: 0.3 }}
        className="flex items-center justify-between font-mono text-[10px] text-muted-foreground"
      >
        <span>7,423 / 10,000</span>
        <span>MRR $1,127</span>
      </motion.div>
    </div>
  )
}

type TraceRowSpec = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  status: "ok" | "running" | "error"
  duration: string
  /** Delay (ms) before this row transitions from running to ok. */
  completesAt: number
}

const traceRows: ReadonlyArray<TraceRowSpec> = [
  {
    icon: Check,
    label: "email.send",
    status: "ok",
    duration: "1.2s",
    completesAt: 1800,
  },
  {
    icon: Loader,
    label: "slack.notify",
    status: "running",
    duration: "1.1s",
    completesAt: 3300,
  },
  {
    icon: Check,
    label: "db.write",
    status: "ok",
    duration: "240ms",
    completesAt: 4500,
  },
  {
    icon: Check,
    label: "webhook.dispatch",
    status: "ok",
    duration: "80ms",
    completesAt: 5700,
  },
]

/**
 * Top-level helper so the per-row status setter doesn't deepen the
 * useEffect's callback nesting past the 4-level lint ceiling.
 */
function markComplete(
  setOverrides: React.Dispatch<
    React.SetStateAction<Record<number, TraceRowSpec["status"]>>
  >,
  i: number,
  status: TraceRowSpec["status"],
) {
  setOverrides((prev) => ({ ...prev, [i]: status }))
}

/**
 * All four rows start in `running` and complete one by one. We keep a
 * per-row override in state so the static `status` field in the spec
 * becomes a starting hint only — the actual transition is driven by
 * the timer set up in the useEffect below.
 */
function JobsTraceMockup() {
  // index → status override
  const [overrides, setOverrides] = useState<Record<number, TraceRowSpec["status"]>>(
    () => Object.fromEntries(traceRows.map((_, i) => [i, "running" as const])),
  )

  useEffect(() => {
    const timers = traceRows.map((row, i) =>
      window.setTimeout(() => markComplete(setOverrides, i, row.status), row.completesAt),
    )
    return () => {
      timers.forEach(clearTimeout)
    }
  }, [])

  return (
    <ul className="flex flex-col divide-y divide-border">
      {traceRows.map((row, i) => {
        // Icon is driven by the *current* status, not the row's
        // static field — every row starts as running, so they all
        // show the spinning Loader until their timer flips them.
        const RowIcon =
          (overrides[i] ?? row.status) === "running"
            ? Loader
            : (overrides[i] ?? row.status) === "error"
              ? AlertTriangle
              : Check
        const status = overrides[i] ?? row.status
        const color =
          status === "ok"
            ? "text-emerald-500"
            : status === "running"
              ? "text-violet-500"
              : "text-red-500"
        return (
          <motion.li
            key={row.label}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.3 }}
            className="flex items-center gap-2 px-3 py-1.5 font-mono text-[11px]"
          >
            <RowIcon
              className={cn(
                "size-3 shrink-0",
                color,
                status === "running" && "animate-spin",
              )}
              aria-hidden
            />
            <span className="text-foreground/90">{row.label}</span>
            <span
              className={cn(
                "ml-auto",
                status === "error" ? color : "text-muted-foreground",
              )}
            >
              {row.duration}
            </span>
          </motion.li>
        )
      })}
    </ul>
  )
}

type StorageRowSpec = {
  icon: React.ComponentType<{ className?: string }>
  name: string
  size: string
  indent: number
  /** Tailwind text-* class applied to the row icon and name. */
  color: string
}

const storageRows: ReadonlyArray<StorageRowSpec> = [
  {
    icon: Folder,
    name: "uploads/",
    size: "",
    indent: 0,
    color: "text-amber-500",
  },
  {
    icon: FileText,
    name: "invoice-2024-q4.pdf",
    size: "4 MB",
    indent: 1,
    color: "text-red-500",
  },
  {
    icon: ImageIcon,
    name: "avatar-3x.png",
    size: "240 KB",
    indent: 1,
    color: "text-emerald-500",
  },
  {
    icon: Boxes,
    name: "export.zip",
    size: "12 MB",
    indent: 1,
    color: "text-violet-500",
  },
]

/**
 * The folder row appears first, then the three files fade in with a
 * stagger. The "+ Upload" hint slides up last.
 */
function StorageBrowserMockup() {
  return (
    <ul className="flex flex-col gap-1 p-3 font-mono text-[11px]">
      {storageRows.map((row, i) => {
        const RowIcon = row.icon
        return (
          <motion.li
            key={row.name}
            initial={{ opacity: 0, y: -4 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.3 }}
            className="flex items-center gap-1.5"
            style={{ paddingLeft: `${row.indent * 12}px` }}
          >
            <RowIcon
              className={cn("size-3 shrink-0 opacity-60", row.color)}
              aria-hidden
            />
            <span>{row.name}</span>
            {row.size ? (
              <span className="ml-auto text-muted-foreground/70">{row.size}</span>
            ) : null}
          </motion.li>
        )
      })}
      <motion.li
        initial={{ opacity: 0, y: 4 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 + storageRows.length * 0.12 + 0.1, duration: 0.3 }}
        className="mt-1 flex items-center gap-1.5 text-foreground/80"
      >
        <CloudUpload className="size-3" aria-hidden /> + Upload
      </motion.li>
    </ul>
  )
}

type OtelRowSpec = {
  indent: number
  label: string
  duration: string
  branch: "├" | "└" | null
  /** Log severity — drives the row colour. */
  level: "info" | "warn" | "error"
}

const otelRows: ReadonlyArray<OtelRowSpec> = [
  { indent: 0, label: "GET /checkout", duration: "142ms", branch: null, level: "info" },
  { indent: 1, label: "auth.verify", duration: "12ms", branch: "├", level: "info" },
  { indent: 1, label: "fetch", duration: "45ms", branch: "├", level: "info" },
  { indent: 1, label: "db.query", duration: "62ms", branch: "├", level: "warn" },
  { indent: 1, label: "cache.set", duration: "23ms", branch: "└", level: "error" },
]

const LEVEL_COLOR = {
  info: "text-muted-foreground",
  warn: "text-amber-500",
  error: "text-red-500",
} as const

/**
 * The parent request row slides in from the top. The four sub-traces
 * then fade in top-to-bottom. A small progress bar fills in under the
 * parent label so the waterfall reads visually.
 *
 * Colours by log level (a single multi-colour waterfall, not a
 * single-tone mockup):
 *   - info  → blue
 *   - warn  → amber
 *   - error → red
 * The four sub-traces show one of each level on purpose, so the
 * reader sees the severity scale at a glance.
 */
function OtelWaterfallMockup() {
  return (
    <ul className="flex flex-col gap-1.5 p-3 font-mono text-[11px]">
      <motion.li
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center gap-2 text-foreground">
          <Activity className="size-3" aria-hidden />
          <span>GET /checkout</span>
          <span className="ml-auto text-muted-foreground">142ms</span>
        </div>
        <div className="flex h-1 gap-0.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            aria-hidden
            initial={{ width: 0 }}
            whileInView={{ width: "12%" }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-zinc-400"
          />
          <motion.div
            aria-hidden
            initial={{ width: 0 }}
            whileInView={{ width: "32%" }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-zinc-400"
          />
          <motion.div
            aria-hidden
            initial={{ width: 0 }}
            whileInView={{ width: "44%" }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-amber-500"
          />
          <motion.div
            aria-hidden
            initial={{ width: 0 }}
            whileInView={{ width: "12%" }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-red-500"
          />
        </div>
      </motion.li>
      {otelRows.slice(1).map((row, i) => (
        <motion.li
          key={row.label}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 + i * 0.12, duration: 0.3 }}
          className="flex items-center gap-2"
          style={{ paddingLeft: `${row.indent * 12}px` }}
        >
          {row.branch ? (
            <span className="text-muted-foreground/60">{row.branch}</span>
          ) : null}
          <span className={LEVEL_COLOR[row.level]}>{row.label}</span>
          <span className={cn("ml-auto", LEVEL_COLOR[row.level])}>
            {row.duration}
          </span>
        </motion.li>
      ))}
    </ul>
  )
}

function ContractMockup({
  kind,
}: {
  kind: Contract["mockup"]
}) {
  switch (kind) {
    case "auth-form":
      return <AuthFlowMockup />
    case "db-terminal":
      return <DbTerminalMockup />
    case "billing-widget":
      return <BillingWidgetMockup />
    case "jobs-trace":
      return <JobsTraceMockup />
    case "storage-browser":
      return <StorageBrowserMockup />
    case "otel-waterfall":
      return <OtelWaterfallMockup />
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Re-export for use by the homepage (kept in this file so the contracts
// data + the grid live together — the homepage only needs to import
// { ContractsGrid }).
// ---------------------------------------------------------------------------
export type { Contract, Provider }
