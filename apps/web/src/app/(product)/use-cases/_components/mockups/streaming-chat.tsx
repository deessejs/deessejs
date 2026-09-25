"use client"

/**
 * Streaming chat mockup.
 *
 * A single conversation thread: the user prompt renders first, then
 * the agent response streams in token by token. A blinking cursor
 * stays at the end of the stream until completion.
 *
 * Visual reference: ChatGPT streaming response, Cursor agent panel.
 * Conveys "your agent responds live, not as a one-shot blob".
 */

import { useEffect, useState } from "react"
import * as m from "motion/react-m"

import { MockupMotionBoundary } from "./motion-boundary"

const PROMPT = "What's our MRR this month, and how does it compare to last month?"

const RESPONSE =
  "Your MRR this month is $11,270 across 8 active workspaces, up from $9,840 last month - that's a 14.5% increase. The biggest contributors were the Pilot Co and Acme Labs upgrades."

const TYPING_SPEED_MS = 28

export function StreamingChatMockup() {
  const [shown, setShown] = useState("")

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    const tick = (i: number) => {
      if (cancelled) return
      setShown(RESPONSE.slice(0, i))
      if (i < RESPONSE.length) {
        timer = window.setTimeout(() => tick(i + 1), TYPING_SPEED_MS)
      }
    }

    timer = window.setTimeout(() => tick(1), 600)

    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [])

  return (
    <MockupMotionBoundary>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between text-label-12 uppercase tracking-wider text-muted-foreground">
          <span>Thread</span>
          <span className="font-mono text-label-12 text-violet-600 dark:text-violet-400">
            streaming
          </span>
        </div>

        {/* User prompt */}
        <m.div
          initial={{ opacity: 0, y: 4 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-1.5 rounded-sm border border-border bg-muted/40 p-3"
        >
          <span className="text-label-12 uppercase tracking-wider text-muted-foreground">
            you
          </span>
          <p className="text-copy-13 text-foreground">{PROMPT}</p>
        </m.div>

        {/* Agent response */}
        <m.div
          initial={{ opacity: 0, y: 4 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="flex flex-col gap-1.5 rounded-sm border border-violet-500/30 bg-violet-500/5 p-3"
        >
          <span className="text-label-12 uppercase tracking-wider text-violet-600 dark:text-violet-400">
            agent
          </span>
          <p className="text-copy-13 leading-6 text-foreground">
            {shown}
            <span
              aria-hidden
              className="ml-px inline-block h-3 w-px animate-pulse bg-violet-500 align-middle"
            />
          </p>
        </m.div>

        {/* Footnote: stream complete */}
        <m.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: shown.length === RESPONSE.length ? 1 : 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex items-center justify-between font-mono text-label-12 text-muted-foreground"
        >
          <span>
            {shown.length} / {RESPONSE.length} chars
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            done - 12 tools available
          </span>
        </m.div>
      </div>
    </MockupMotionBoundary>
  )
}