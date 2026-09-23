"use client"

/**
 * Organization switcher mockup.
 *
 * Shows the popover that opens from the top-left avatar in the admin
 * shell. The current org is highlighted, the other workspaces show
 * their plan badge and member count, and a "Create workspace" row
 * sits at the bottom.
 *
 * Conveys "workspaces and orgs ship in the registry - one contract
 * for tenant isolation".
 */

import { motion } from "motion/react"
import { Check, Plus } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

type Org = {
  id: string
  name: string
  slug: string
  plan: "free" | "pro" | "enterprise"
  members: number
  current?: boolean
}

const ORGS: ReadonlyArray<Org> = [
  { id: "org_2nK9xR", name: "Acme Labs", slug: "acme-labs", plan: "pro", members: 8, current: true },
  { id: "org_3pQ7mT", name: "Pilot Co", slug: "pilot-co", plan: "free", members: 3 },
  { id: "org_4rW1kZ", name: "Stealth B2B", slug: "stealth-b2b", plan: "enterprise", members: 24 },
]

const PLAN_STYLES: Record<Org["plan"], string> = {
  free: "border-zinc-500/30 text-zinc-500",
  pro: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
  enterprise: "border-violet-500/30 text-violet-600 dark:text-violet-400",
}

export function MultiTenantSwitcherMockup() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between text-label-12 uppercase tracking-wider text-muted-foreground">
        <span>Switch workspace</span>
        <span className="font-mono">org.list()</span>
      </div>
      <ul className="flex flex-col overflow-hidden rounded-md border border-border bg-background">
        {ORGS.map((org, i) => (
          <motion.li
            key={org.id}
            initial={{ opacity: 0, y: -4 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.3 }}
            className={cn(
              "flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0",
              org.current && "bg-accent/40",
            )}
          >
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 font-mono text-label-13 text-foreground"
              aria-hidden
            >
              {org.name.slice(0, 1)}
            </span>
            <div className="flex flex-1 flex-col leading-tight">
              <span className="flex items-center gap-2 text-copy-13 text-foreground">
                {org.name}
                {org.current ? (
                  <Check
                    className="size-3 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                ) : null}
              </span>
              <span className="font-mono text-label-12 text-muted-foreground">
                {org.slug} . {org.members} members
              </span>
            </div>
            <span
              className={cn(
                "rounded-sm border px-1.5 py-0.5 font-mono text-label-12",
                PLAN_STYLES[org.plan],
              )}
            >
              {org.plan}
            </span>
          </motion.li>
        ))}
        <motion.li
          initial={{ opacity: 0, y: 4 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + ORGS.length * 0.15 + 0.1, duration: 0.3 }}
          className="flex items-center gap-2 px-3 py-2 text-copy-13 text-foreground"
        >
          <Plus className="size-3" aria-hidden /> Create workspace
        </motion.li>
      </ul>
    </div>
  )
}
