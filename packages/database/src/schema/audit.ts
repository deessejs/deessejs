import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

/**
 * Audit-run header row. One per scheduled (or manually dispatched) run.
 */
export const auditRun = pgTable(
  "audit_run",
  {
    id: text("id").primaryKey(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    trigger: text("trigger").notNull(),
    status: text("status").notNull(),
    config: jsonb("config").notNull(),
  },
  (table) => [index("idx_run_started_at").on(table.startedAt)],
)

/**
 * One (repository, specialist) mission within an audit run.
 *
 * Status values:
 *   - "checkout-pending"  Mission dispatched, no specialist feedback yet.
 *   - "checkout-failed"   checkout_repo refused (main advanced, etc.).
 *   - "auditing"          Specialist started inspecting the tree.
 *   - "completed"         Specialist finished and reported findings.
 *   - "no-scope"          Specialist inspected the tree but found no
 *                         relevant surface for its axis (e.g. data
 *                         reviewer on a repo without persistence).
 *                         examinedPaths / examinedManifests are populated.
 *   - "failed"            Specialist or tool chain threw.
 */
export const auditRunMission = pgTable(
  "audit_run_mission",
  {
    runId: text("run_id")
      .notNull()
      .references(() => auditRun.id, { onDelete: "cascade" }),
    repository: text("repository").notNull(),
    installationId: integer("installation_id").notNull(),
    mainSha: text("main_sha").notNull(),
    specialist: text("specialist").notNull(),
    childSessionId: text("child_session_id"),
    status: text("status").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    examinedPaths: jsonb("examined_paths").$type<string[]>(),
    examinedManifests: jsonb("examined_manifests").$type<string[]>(),
    issuesOpened: jsonb("issues_opened").$type<number[]>(),
    notes: text("notes"),
    failureReason: text("failure_reason"),
  },
  (table) => [
    primaryKey({
      columns: [table.runId, table.repository, table.specialist],
    }),
    index("idx_mission_status").on(table.status),
  ],
)

/**
 * Optional dedup store. Populated only after M3 if duplicate races are
 * observed in practice. The (repository, fingerprint) pair is unique so
 * the row insert acts as an atomic "claim".
 */
export const auditFingerprint = pgTable(
  "audit_fingerprint",
  {
    repository: text("repository").notNull(),
    fingerprint: text("fingerprint").notNull(),
    issueNumber: integer("issue_number").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("uniq_repo_fp").on(table.repository, table.fingerprint)],
)

export type AuditRun = typeof auditRun.$inferSelect
export type AuditRunMission = typeof auditRunMission.$inferSelect
export type AuditFingerprint = typeof auditFingerprint.$inferSelect