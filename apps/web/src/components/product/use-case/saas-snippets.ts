/**
 * SaaS pillar code snippets - server-only module.
 *
 * TypeScript samples for each of the eight pillars the saas-apps use
 * case surfaces: auth, billing, admin, database (customer-facing
 * half) and api, mcp, jobs, mail (behind-the-curtain half). Rendered
 * through `EcosystemCodeMockup` (the same client component the
 * homepage Ecosystem section uses) on `/use-cases/saas-apps`.
 *
 * Each pillar exposes a single `SaasPillarTool` entry, which is a
 * bundle of one or more `SaasPillarSnippet` files (typed by
 * filename + lang + code). All eight pillars ship with a single file
 * so the mockup reads as a clean single-tab surface, mirroring the
 * `drpc` / `collections` entries in the homepage ecosystem registry.
 *
 * Server-only because the consumer pre-highlights the snippets
 * server-side. Keeping the strings in a sibling `.ts` file means
 * this module never ships in the client's JS bundle, and the
 * snippets are easy to edit without touching the layout
 * components.
 *
 * Snippets are illustrative. The actual public API of each
 * package may differ once the broader registry stabilises; trim
 * or adjust each sample as the real surface lands. Each snippet
 * is written to look like a real working file (imports, exports,
 * the function the buyer would actually call) rather than a
 * marketing place-holder.
 */

export type SaasPillarSlug =
  | "auth"
  | "billing"
  | "admin"
  | "database"
  | "api"
  | "mcp"
  | "jobs"
  | "mail"

export type SaasPillarSnippet = {
  /** Filename shown in the mockup title bar. */
  tabName: string
  /** Shiki language id. */
  lang: "typescript"
  /** TypeScript source, <=15 lines. */
  code: string
}

/** A pillar bundles one or more file snippets. */
export type SaasPillarTool = {
  files: ReadonlyArray<SaasPillarSnippet>
}

const authFile: SaasPillarSnippet = {
  tabName: "auth.config.ts",
  lang: "typescript",
  code: `import { betterAuth } from "@deessejs/auth"
import { email, oauth, password } from "@deessejs/auth/providers"

export const auth = betterAuth({
  database: db,
  plugins: [
    email({ from: "no-reply@deessejs.com" }),
    password(),
    oauth({ providers: ["github", "google", "microsoft"] }),
  ],
  session: { expiresIn: 60 * 60 * 24 * 7 },
})`,
}

const billingFile: SaasPillarSnippet = {
  tabName: "billing.ts",
  lang: "typescript",
  code: `import { stripe } from "@deessejs/billing"
import { plans } from "./plans"

export const billing = stripe({
  plans,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  onSubscriptionCreated: (sub) =>
    db.org.update(sub.orgId, { plan: sub.plan }),
})

export const createCheckout = billing.checkout
export const createPortalLink = billing.portal`,
}

const adminFile: SaasPillarSnippet = {
  tabName: "admin.ts",
  lang: "typescript",
  code: `import { protectedProcedure, router } from "@deessejs/api"
import { z } from "zod"

export const adminRouter = router({
  impersonateUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.audit.record("impersonate", input.userId, () =>
        ctx.session.impersonate(input.userId)
      )
    ),
  refundInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(({ ctx, input }) =>
      billing.refund(input.invoiceId)
    ),
})`,
}

const databaseFile: SaasPillarSnippet = {
  tabName: "schema.ts",
  lang: "typescript",
  code: `import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core"

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => orgs.id),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
  seats: integer("seats").notNull().default(1),
  renewsAt: timestamp("renews_at"),
})

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id").references(() => subscriptions.id),
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
})`,
}

const apiFile: SaasPillarSnippet = {
  tabName: "router.ts",
  lang: "typescript",
  code: `import { os, ORPCError } from "@orpc/server"
import { z } from "zod"
import { db } from "./database"

export const listInvoices = os
  .input(z.object({ orgId: z.string(), limit: z.number().int().min(1).max(100) }))
  .handler(async ({ input, context }) => {
    if (!context.user.belongsTo(input.orgId)) {
      throw new ORPCError("FORBIDDEN")
    }
    return db.invoice.findMany({
      where: { orgId: input.orgId },
      take: input.limit,
    })
  })`,
}

const mcpFile: SaasPillarSnippet = {
  tabName: "mcp.ts",
  lang: "typescript",
  code: `import { createMcpServer } from "@deessejs/mcp"
import { adminRouter } from "./admin"

export const mcp = createMcpServer({
  name: "saas-admin",
  tools: {
    listInvoices: {
      description: "List invoices for an organisation.",
      input: z.object({ orgId: z.string() }),
      handler: adminRouter.listInvoices,
    },
    refundInvoice: {
      description: "Refund an invoice by id.",
      input: z.object({ invoiceId: z.string() }),
      handler: adminRouter.refundInvoice,
    },
  },
})`,
}

const jobsFile: SaasPillarSnippet = {
  tabName: "queue.ts",
  lang: "typescript",
  code: `import { Queue, Worker } from "@deessejs/queue"

export const emailQueue = new Queue("email", {
  defaultJobOptions: { attempts: 3, backoff: { type: "exponential" } },
})

new Worker("email", async (job) => {
  switch (job.name) {
    case "welcome":
      return mail.send(WelcomeEmail(job.data))
    case "renewal":
      return mail.send(RenewalEmail(job.data))
  }
})`,
}

const mailFile: SaasPillarSnippet = {
  tabName: "mail.tsx",
  lang: "typescript",
  code: `import { resend } from "@deessejs/mail"
import { WelcomeEmail } from "./emails/welcome"

export const mail = resend({
  from: "DeesseJS <hello@deessejs.com>",
})

export const sendWelcome = (user: { email: string; name: string }) =>
  mail.send({
    to: user.email,
    subject: "Welcome to " + user.name + "'s workspace",
    react: <WelcomeEmail name={user.name} />,
  })`,
}

export const SAAS_SNIPPETS: Record<SaasPillarSlug, SaasPillarTool> = {
  auth:     { files: [authFile] },
  billing:  { files: [billingFile] },
  admin:    { files: [adminFile] },
  database: { files: [databaseFile] },
  api:      { files: [apiFile] },
  mcp:      { files: [mcpFile] },
  jobs:     { files: [jobsFile] },
  mail:     { files: [mailFile] },
}
