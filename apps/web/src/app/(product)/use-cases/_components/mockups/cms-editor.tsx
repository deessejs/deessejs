"use client"

/**
 * MDX editor mockup.
 *
 * Two panes:
 *   - left: frontmatter fields + markdown body, with key fields typing in
 *   - right: rendered preview that updates as fields land
 *
 * Visual reference: Contentlayer / Fumadocs studio / Linear issue body.
 * Conveys "blog and docs ship with the registry, taxonomy wired".
 */

import { motion } from "motion/react"
import { Check } from "lucide-react"

const FRONTMATTER = `---
title: "Ship from contracts, not scratch"
slug: ship-from-contracts
date: 2026-09-14
tags: [saas, agents, registry]
author: martyy
status: published
---

Your agent navigates the same
contracts the registry ships. The
template doesn't just scaffold - it
locks the surface so the model
cannot drift.`

const RENDERED = (
  <>
    <h3 className="text-base font-medium tracking-tight text-foreground">
      Ship from contracts, not scratch
    </h3>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">
      Your agent navigates the same contracts the registry ships. The
      template doesn&rsquo;t just scaffold — it locks the surface so the model
      cannot drift.
    </p>
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {["saas", "agents", "registry"].map((tag) => (
        <span
          key={tag}
          className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
        >
          {tag}
        </span>
      ))}
    </div>
  </>
)

export function CmsEditorMockup() {
  return (
    <div className="flex flex-col gap-0 divide-y divide-border lg:grid lg:grid-cols-2 lg:divide-x lg:divide-y-0">
      {/* Source pane */}
      <div className="flex flex-col gap-3 bg-zinc-950 p-4 font-mono text-copy-13">
        <div className="flex items-center justify-between text-label-12 uppercase tracking-wider text-zinc-500">
          <span>Source</span>
          <span>post.mdx</span>
        </div>
        <motion.pre
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden whitespace-pre text-zinc-100"
        >
          {FRONTMATTER.split("").map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.01, duration: 0.05 }}
            >
              {char === "\n" ? <br /> : char}
            </motion.span>
          ))}
        </motion.pre>
      </div>

      {/* Preview pane */}
      <div className="flex flex-col gap-3 bg-background p-4">
        <div className="flex items-center justify-between text-label-12 uppercase tracking-wider text-muted-foreground">
          <span>Preview</span>
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 2.0, duration: 0.3 }}
            className="flex items-center gap-1 rounded-sm bg-emerald-500/15 px-1.5 py-0.5 text-emerald-700 dark:text-emerald-300"
          >
            <Check className="size-2.5" aria-hidden />
            rendered
          </motion.span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.6, duration: 0.4 }}
        >
          {RENDERED}
        </motion.div>
      </div>
    </div>
  )
}
