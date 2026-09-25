"use client"

/**
 * OpenTelemetry waterfall: parent request slides in from the top,
 * sub-traces fade in top-to-bottom, progress bar fills under the
 * parent label.
 *
 * Colours by log level:
 *   - info  -> muted zinc
 *   - warn  -> amber
 *   - error -> red
 */

import { motion } from "motion/react"
import { Activity } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

type OtelRowSpec = {
  indent: number
  label: string
  duration: string
  branch: "|" | "-" | null
  level: "info" | "warn" | "error"
}

const otelRows: ReadonlyArray<OtelRowSpec> = [
  { indent: 0, label: "GET /checkout", duration: "142ms", branch: null, level: "info" },
  { indent: 1, label: "auth.verify", duration: "12ms", branch: "|", level: "info" },
  { indent: 1, label: "fetch", duration: "45ms", branch: "|", level: "info" },
  { indent: 1, label: "db.query", duration: "62ms", branch: "|", level: "warn" },
  { indent: 1, label: "cache.set", duration: "23ms", branch: "-", level: "error" },
]

const LEVEL_COLOR = {
  info: "text-muted-foreground",
  warn: "text-amber-500",
  error: "text-red-500",
} as const

export function OtelWaterfallMockup() {
  return (
    <ul className="flex flex-col gap-1.5 p-4 font-mono text-copy-13">
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
        <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-muted">
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
