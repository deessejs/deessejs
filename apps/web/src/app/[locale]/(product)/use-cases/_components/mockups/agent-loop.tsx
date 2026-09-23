"use client"

/**
 * Agent loop trace mockup.
 *
 * A vertical timeline showing how the agent plans a tool call, executes
 * it, reads the result, and decides the next step. Each row carries a
 * status (planning / calling / done / failed) and the tool name +
 * result preview.
 *
 * Visual reference: Cursor homepage cloud-agents dashboard, OpenAI
 * function-calling trace. Conveys "your agent reads the contract, calls
 * the typed tool, gets the typed result" without showing actual code.
 */

import { motion } from "motion/react"
import { Check, Loader, Sparkles } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

type Step = {
  kind: "plan" | "call" | "result"
  label: string
  detail: string
  delayMs: number
}

const STEPS: ReadonlyArray<Step> = [
  {
    kind: "plan",
    label: "plan",
    detail: "I need billing data for org_2nK9xR",
    delayMs: 200,
  },
  {
    kind: "call",
    label: "billing.read",
    detail: "GET /v1/orgs/org_2nK9xR/billing",
    delayMs: 700,
  },
  {
    kind: "result",
    label: "ok",
    detail: '{ mrr: 1127, plan: "pro", seats: 8 }',
    delayMs: 1300,
  },
  {
    kind: "plan",
    label: "plan",
    detail: "Format the answer for the user",
    delayMs: 1900,
  },
]

const KIND_STYLES: Record<
  Step["kind"],
  { dot: string; label: string; row: string }
> = {
  plan: {
    dot: "bg-violet-500",
    label: "text-violet-600 dark:text-violet-400",
    row: "border-violet-500/20 bg-violet-500/5",
  },
  call: {
    dot: "bg-zinc-400",
    label: "text-foreground",
    row: "border-zinc-200 bg-background dark:border-zinc-800",
  },
  result: {
    dot: "bg-emerald-500",
    label: "text-emerald-600 dark:text-emerald-400",
    row: "border-emerald-500/20 bg-emerald-500/5",
  },
}

export function AgentLoopMockup() {
  return (
    <div className="flex flex-col gap-3 p-4 font-mono text-copy-13">
      <div className="flex items-center justify-between text-label-12 uppercase tracking-wider text-muted-foreground">
        <span>Agent run</span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3 text-violet-500" aria-hidden />
          gpt-5 + tools
        </span>
      </div>
      <ol className="flex flex-col gap-1.5">
        {STEPS.map((step, i) => {
          const styles = KIND_STYLES[step.kind]
          return (
            <motion.li
              key={`${step.kind}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: step.delayMs / 1000, duration: 0.3 }}
              className={cn(
                "flex items-start gap-2 rounded-sm border px-3 py-2",
                styles.row,
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 size-1.5 shrink-0 rounded-full",
                  styles.dot,
                )}
              />
              <span className={cn("shrink-0 text-label-12", styles.label)}>
                {step.label}
              </span>
              <span className="flex-1 truncate text-foreground/80">
                {step.detail}
              </span>
              {step.kind === "result" ? (
                <Check
                  className="size-3 shrink-0 text-emerald-500"
                  aria-hidden
                />
              ) : null}
              {step.kind === "call" ? (
                <Loader
                  className="size-3 shrink-0 animate-spin text-zinc-400"
                  aria-hidden
                />
              ) : null}
            </motion.li>
          )
        })}
      </ol>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 2.2, duration: 0.3 }}
        className="mt-1 flex items-center gap-2 rounded-sm border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-label-12 text-violet-700 dark:text-violet-300"
      >
        <Check className="size-3" aria-hidden />
        Run complete - 4 steps, 1.4s, 847 tokens
      </motion.div>
    </div>
  )
}
