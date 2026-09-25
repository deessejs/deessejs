"use client"

/**
 * Three-phase authentication flow: form -> loading -> success.
 *
 *   1. form    - email + password fill in, Continue button appears
 *   2. loading - form fades, spinner + "Signing in..." appears
 *   3. success - avatar + "Authenticated" + green check
 *
 * Colour discipline: only the macOS traffic-light dots and the
 * final success check carry colour. Everything else stays
 * monochrome, matching the rest of the home.
 */

import { useEffect, useState } from "react"
import * as m from "motion/react-m"
import { AnimatePresence } from "motion/react"
import { Check, Loader } from "lucide-react"

import { MockupMotionBoundary } from "./motion-boundary"

type AuthPhase = "form" | "loading" | "success"

/** Per-character typing speed for the Auth fields (ms / char). */
const TYPING_SPEED_MS = 100

/** How long the loading state stays before flipping to success. */
const LOADING_MS = 1400

/** How long the filled form sits before the auto-submit fires. */
const FORM_HOLD_MS = 2300

export function AuthFlowMockup() {
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
    <MockupMotionBoundary>
      <div className="p-4">
        <div className="mb-3 flex items-center gap-1.5 border-b border-border pb-2">
          <span className="size-2 rounded-full bg-red-500" aria-hidden />
          <span className="size-2 rounded-full bg-amber-500" aria-hidden />
          <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
          <span className="ml-1 font-mono text-label-12 text-muted-foreground/70">
            sign-in
          </span>
        </div>

        <div className="relative flex h-[120px] items-center justify-center p-2">
          <AnimatePresence mode="wait" initial={false}>
            {phase === "form" && (
              <m.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-x-2 inset-y-0 flex flex-col gap-2 justify-center"
              >
                <TypingField label="email" text="sarah@acme.io" startMs={300} />
                <TypingField
                  label="password"
                  text="hunter22!"
                  mask
                  startMs={1100}
                />
                <m.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.85, duration: 0.3 }}
                  className="mt-1 flex items-center justify-end"
                >
                  <span className="rounded-sm border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-label-12 text-zinc-100">
                    Continue
                  </span>
                </m.div>
              </m.div>
            )}
            {phase === "loading" && (
              <m.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-x-2 inset-y-0 flex flex-col items-center justify-center gap-2"
              >
                <Loader
                  className="size-4 animate-spin text-foreground"
                  aria-hidden
                />
                <span className="font-mono text-label-12 text-muted-foreground">
                  Signing in...
                </span>
              </m.div>
            )}
            {phase === "success" && (
              <m.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-x-2 inset-y-0 flex items-center justify-center gap-2"
              >
                <span
                  aria-hidden
                  className="flex size-7 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15"
                >
                  <Check
                    className="size-3.5 text-emerald-500"
                    strokeWidth={3}
                    aria-hidden
                  />
                </span>
                <span className="font-mono text-label-13 text-foreground">
                  Authenticated
                </span>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MockupMotionBoundary>
  )
}

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
    let cancelled = false
    let timer: number | undefined

    const tick = (i: number) => {
      if (cancelled) return
      setShown(mask ? "•".repeat(i) : text.slice(0, i))
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
    <div className="flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-1.5">
      <span className="font-mono text-label-12 text-muted-foreground">
        {label}
      </span>
      <span className="ml-auto flex max-w-[60%] items-center gap-0.5 overflow-hidden whitespace-nowrap font-mono text-copy-13 text-foreground/90">
        <span>{shown}</span>
        <span
          aria-hidden
          className="inline-block h-3 w-px animate-pulse bg-foreground/70"
        />
      </span>
    </div>
  )
}