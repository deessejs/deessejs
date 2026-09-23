"use client"

/**
 * Two `$` lines type out character-by-character; on completion a third
 * "tables" line fades in.
 *
 * Colours (terminal colour scheme, fixed regardless of theme):
 *   - prompt `$`  -> cyan
 *   - command     -> white
 *   - success     -> emerald
 *   - table list  -> zinc-400 (muted)
 */

import { motion } from "motion/react"

export function DbTerminalMockup() {
  const line1 = "$ drizzle-kit generate"
  const line1Out = "4 schemas generated"
  const line2 = "$ drizzle-kit migrate"
  const line2Out = "12 tables created"
  const line3 = "users . orgs . sessions . invoices ..."

  return (
    <div className="bg-zinc-950 p-4 font-mono text-copy-13 leading-6">
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
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
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
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
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
