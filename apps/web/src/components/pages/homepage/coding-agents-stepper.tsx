"use client"

import { useEffect, useRef, useState } from "react"
import { MessageSquare, Rocket, Wrench } from "lucide-react"
import { useReducedMotion } from "motion/react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

/**
 * Animated 3-step stepper for the CodingAgents editorial column.
 *
 * Built on the shadcn `Accordion` primitive (`type="single"
 * collapsible`) so the visual rhythm matches the FAQ on the same
 * page. Three states auto-cycle every 5 seconds (Talk → Build →
 * Ship → Talk) so the right column reads as a live legend to the
 * chat mockup on the left.
 *
 * Behavior matrix:
 *
 * - Mount:  `value="talk"` — the first step opens immediately, no
 *           empty state, the visitor sees a body in place.
 * - Cycle:  every 5 s, `value` advances through the 3 keys
 *           modulo 3. Driven by a single `useEffect` + setInterval,
 *           cleaned up on unmount.
 * - Click:  any click on an `AccordionTrigger` calls
 *           `onValueChange` which sets `paused=true` and clears
 *           the interval. From that moment the user owns the
 *           state — the cycle never resumes.
 * - Reduced motion: `useReducedMotion()` short-circuits the entire
 *           effect; the cycle never spins, "Talk" stays open
 *           permanently, Radix skips its `data-open` transition.
 *
 * The chevrons shipped by `<AccordionTrigger>` are hidden here via
 * the `**:data-[slot=accordion-trigger-icon]:hidden` selector so
 * the stepper stays minimal — open/closed is read through the
 * body that appears below the title, not a chevron.
 *
 * The left rail on each `<AccordionItem>` uses Radix's `data-state`
 * attribute (`data-state="open"` when the item is expanded) to
 * swap `bg-border` → `bg-foreground`. The cycle makes the rail
 * "live" without an explicit progress bar.
 */
const TALK_STEPS = [
  {
    value: "talk",
    Icon: MessageSquare,
    title: "Talk",
    body: "Open a session with your agent the way you open a chat. It already knows the registry, reads AGENTS.md at the monorepo root, and runs the CLI when asked.",
  },
  {
    value: "build",
    Icon: Wrench,
    title: "Build",
    body: "Tell it what you need in plain language: scaffold a template, swap a contract, wire observability. It picks the right command and runs it, with the contracts as the source of truth.",
  },
  {
    value: "ship",
    Icon: Rocket,
    title: "Ship",
    body: "Same conversation surface as your editor, same primitives across Claude Code, Codex, OpenCode, Cursor, Windsurf, and Gemini CLI. The CLI stays portable, the agent stays yours.",
  },
] as const

const STEP_KEYS = TALK_STEPS.map((step) => step.value) as ReadonlyArray<
  (typeof TALK_STEPS)[number]["value"]
>

const STEP_INTERVAL_MS = 5_000

export function CodingAgentsStepper() {
  const reduceMotion = useReducedMotion()
  const [value, setValue] = useState<(typeof STEP_KEYS)[number]>("talk")
  const intervalRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (reduceMotion) return

    intervalRef.current = window.setInterval(() => {
      setValue((current) => {
        const idx = STEP_KEYS.indexOf(current)
        const next = STEP_KEYS[(idx + 1) % STEP_KEYS.length]
        return next ?? "talk"
      })
    }, STEP_INTERVAL_MS)

    return () => {
      if (intervalRef.current !== undefined) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = undefined
      }
    }
  }, [reduceMotion])

  function handleValueChange(next: string) {
    setValue(next as (typeof STEP_KEYS)[number])
    if (intervalRef.current !== undefined) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
  }

  return (
    <Accordion
      type="single"
      collapsible
      value={value}
      onValueChange={handleValueChange}
      className="flex w-full flex-col"
    >
      {TALK_STEPS.map((step) => (
        <AccordionItem
          key={step.value}
          value={step.value}
          className="relative border-0 not-last:border-b-0"
        >
          {/* Left progress rail — bg-border by default, flips to
              bg-foreground on the open item via data-[state=open}. */}
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-px bg-border transition-colors data-[state=open]:bg-foreground"
          />
          <AccordionTrigger
            className="**:data-[slot=accordion-trigger-icon]:hidden justify-start gap-3 rounded-none border-0 px-4 py-5 hover:no-underline lg:px-6 lg:py-6"
          >
            <step.Icon
              aria-hidden
              className="size-4 shrink-0 text-foreground"
            />
            <h3 className="text-heading-20 font-medium tracking-tight text-foreground text-balance">
              {step.title}
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pb-5 pl-12 pr-4 lg:pb-6 lg:pl-[3.25rem] lg:pr-6">
            <p className="text-copy-16 leading-7 text-muted-foreground text-balance">
              {step.body}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}