/**
 * Internal tools pillar code snippets - server-only module.
 *
 * Eight TypeScript samples for the internal tools use case
 * (`/use-cases/internal-tools`): the four existing clusters
 * (Auth & RBAC, Operator console, Support & tickets, Automation)
 * plus four new "behind the curtain" pillars (Impersonation,
 * Audit replay, CSAT tracker, Scheduled jobs).
 *
 * Server-only because the consumer pre-highlights the snippets
 * server-side via `codeToHtml`; the strings never ship in the
 * client's JS bundle.
 *
 * Snippets are illustrative. Real public API may differ.
 */

export type InternalToolsPillarSlug =
  | "better-auth-rbac"
  | "admin-table"
  | "ticket-in-context"
  | "feature-flag"
  | "impersonate"
  | "audit-replay"
  | "csat-tracker"
  | "scheduled-job"

export type InternalToolsPillarSnippet = {
  tabName: string
  lang: "typescript"
  code: string
}

export type InternalToolsPillarTool = {
  files: ReadonlyArray<InternalToolsPillarSnippet>
}

const betterAuthRbacFile: InternalToolsPillarSnippet = {
  tabName: "auth.sso.rbac.ts",
  lang: "typescript",
  code: `import { betterAuth } from "@workspace/auth"
import { roles } from "@workspace/contracts"

export const auth = betterAuth({
  session: { expiresIn: 60 * 60 * 8 },
  plugins: [roles({ roles: ["admin", "support", "finance"] })],
})`,
}

const adminTableFile: InternalToolsPillarSnippet = {
  tabName: "console.drizzle.ts",
  lang: "typescript",
  code: `import { sql } from "drizzle-orm"
import { db, users } from "@workspace/database"

export const listUsers = (filter: { role?: string }) =>
  db
    .select()
    .from(users)
    .where(filter.role ? sql\`role = \${filter.role}\` : undefined)
    .limit(100)`,
}

const ticketInContextFile: InternalToolsPillarSnippet = {
  tabName: "support.context.ts",
  lang: "typescript",
  code: `import { getTicketContext } from "@workspace/contracts"

export const openTicket = async (userId: string) => {
  const ctx = await getTicketContext(userId)
  return {
    user: ctx.user,
    sessions: ctx.recentSessions,
    events: ctx.recentEvents,
  }
}`,
}

const featureFlagFile: InternalToolsPillarSnippet = {
  tabName: "feature-flag.ts",
  lang: "typescript",
  code: `import { flag } from "@workspace/contracts"

export const isOnForOrg = (orgId: string, flagName: string) =>
  flag.evaluate({
    name: flagName,
    targeting: { orgId },
  })`,
}

const impersonateFile: InternalToolsPillarSnippet = {
  tabName: "impersonate.ts",
  lang: "typescript",
  code: `import { impersonate } from "@workspace/auth"
import { audit } from "@workspace/contracts"

export const impersonateUser = (operatorId: string, userId: string) =>
  audit.withRecord({ action: "impersonate", actor: operatorId }, () =>
    impersonate({ userId, operatorId, ttlSeconds: 600 }),
  )`,
}

const auditReplayFile: InternalToolsPillarSnippet = {
  tabName: "audit-replay.ts",
  lang: "typescript",
  code: `import { audit } from "@workspace/contracts"

export const replayAuditLog = (input: { orgId: string; since: Date }) =>
  audit.query({
    where: { orgId: input.orgId, ts: { gte: input.since } },
    orderBy: { ts: "desc" },
    limit: 200,
  })`,
}

const csatTrackerFile: InternalToolsPillarSnippet = {
  tabName: "csat-tracker.ts",
  lang: "typescript",
  code: `import { sql } from "drizzle-orm"
import { db } from "@workspace/database"

export const csatForOperator = (operatorId: string) =>
  db.execute(sql\`
    SELECT AVG(rating) AS avg_rating, COUNT(*) AS n
    FROM tickets
    WHERE assignee = \${operatorId}
      AND rating IS NOT NULL
  \`)`,
}

const scheduledJobFile: InternalToolsPillarSnippet = {
  tabName: "scheduled-job.ts",
  lang: "typescript",
  code: `import { schedule } from "@workspace/api"

export const dailyDigest = schedule({
  cron: "0 8 * * *",
  run: async () => {
    const pending = await fetchPendingTickets()
    await sendDigest(pending)
  },
})`,
}

export const INTERNAL_TOOLS_SNIPPETS: Record<InternalToolsPillarSlug, InternalToolsPillarTool> = {
  "better-auth-rbac":   { files: [betterAuthRbacFile] },
  "admin-table":        { files: [adminTableFile] },
  "ticket-in-context":  { files: [ticketInContextFile] },
  "feature-flag":       { files: [featureFlagFile] },
  "impersonate":        { files: [impersonateFile] },
  "audit-replay":       { files: [auditReplayFile] },
  "csat-tracker":       { files: [csatTrackerFile] },
  "scheduled-job":      { files: [scheduledJobFile] },
}
