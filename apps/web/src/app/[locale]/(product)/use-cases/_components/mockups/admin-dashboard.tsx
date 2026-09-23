"use client"

/**
 * Admin dashboard mockup.
 *
 * Three KPI tiles at the top (MRR, active users, churn) and a table
 * of users below with role + last-seen columns.
 *
 * Conveys "operator console ships in the registry - same auth and
 * contracts as the customer app".
 */

import { motion } from "motion/react"

type Role = "owner" | "admin" | "member"

type UserRow = {
  email: string
  role: Role
  lastSeen: string
}

const KPIS = [
  { label: "MRR", value: "$11,270", delta: "+8.2%", positive: true },
  { label: "Active users", value: "1,420", delta: "+112 / wk", positive: true },
  { label: "Churn", value: "1.4%", delta: "-0.3 pt", positive: true },
] as const

const ROLE_STYLES: Record<Role, string> = {
  owner: "border-violet-500/30 text-violet-600 dark:text-violet-400",
  admin: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
  member: "border-zinc-500/30 text-zinc-500",
}

const USERS: ReadonlyArray<UserRow> = [
  { email: "sarah@acme.io", role: "owner", lastSeen: "now" },
  { email: "eric@acme.io", role: "admin", lastSeen: "2m ago" },
  { email: "didier@acme.io", role: "member", lastSeen: "12m ago" },
  { email: "lena@acme.io", role: "admin", lastSeen: "1h ago" },
  { email: "andreas@acme.io", role: "member", lastSeen: "yesterday" },
]

export function AdminDashboardMockup() {
  return (
    <div className="flex flex-col gap-0 divide-y divide-border">
      {/* KPIs */}
      <div className="grid grid-cols-3 divide-x divide-border">
        {KPIS.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 4 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.3 }}
            className="flex flex-col gap-1 p-4"
          >
            <span className="text-label-12 uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </span>
            <span className="text-heading-20 font-medium tracking-tight text-foreground">
              {kpi.value}
            </span>
            <span className="font-mono text-label-12 text-emerald-600 dark:text-emerald-400">
              {kpi.delta}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Users table */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 text-label-12 uppercase tracking-wider text-muted-foreground">
          <span>Users</span>
          <span className="font-mono">{USERS.length} rows</span>
        </div>
        <ul className="divide-y divide-border">
          {USERS.map((user, i) => (
            <motion.li
              key={user.email}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.3 }}
              className="flex items-center gap-3 px-4 py-2 text-copy-13"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 font-mono text-label-12 text-foreground">
                {user.email.slice(0, 1).toUpperCase()}
              </span>
              <span className="flex-1 truncate font-mono text-copy-13 text-foreground">
                {user.email}
              </span>
              <span
                className={`rounded-sm border px-1.5 py-0.5 font-mono text-label-12 ${ROLE_STYLES[user.role]}`}
              >
                {user.role}
              </span>
              <span className="w-16 shrink-0 text-right font-mono text-label-12 text-muted-foreground">
                {user.lastSeen}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  )
}
