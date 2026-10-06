/**
 * API backends pillar code snippets - server-only module.
 *
 * Eight TypeScript samples for the API backends use case
 * (`/use-cases/api-backends`): the four existing clusters
 * (Typed RPC, Storage layer, Auth & perimeter, Observability)
 * plus four new "behind the curtain" pillars (OpenAPI gen,
 * pg-mem test harness, Service tokens, OTel waterfall).
 *
 * Server-only because the consumer pre-highlights the snippets
 * server-side via `codeToHtml`; the strings never ship in the
 * client's JS bundle.
 *
 * Snippets are illustrative. Real public API may differ.
 */

export type ApiBackendsPillarSlug =
  | "orpc-router"
  | "drizzle-schema"
  | "rate-limit"
  | "audit-log"
  | "openapi-gen"
  | "pgmem-test"
  | "service-token"
  | "otel-waterfall"

export type ApiBackendsPillarSnippet = {
  tabName: string
  lang: "typescript"
  code: string
}

export type ApiBackendsPillarTool = {
  files: ReadonlyArray<ApiBackendsPillarSnippet>
}

const orpcRouterFile: ApiBackendsPillarSnippet = {
  tabName: "orpc-router.ts",
  lang: "typescript",
  code: `import { os, ORPCError } from "@orpc/server"
import { z } from "zod"
import { listInvoices } from "@workspace/database"

export const listInvoicesProcedure = os
  .input(z.object({ orgId: z.string() }))
  .handler(async ({ input, context }) => {
    if (!context.user.belongsTo(input.orgId)) {
      throw new ORPCError("FORBIDDEN")
    }
    return listInvoices(input.orgId)
  })`,
}

const drizzleSchemaFile: ApiBackendsPillarSnippet = {
  tabName: "drizzle.schema.ts",
  lang: "typescript",
  code: `import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  amount: text("amount").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})`,
}

const rateLimitFile: ApiBackendsPillarSnippet = {
  tabName: "rate-limit.ts",
  lang: "typescript",
  code: `import { rateLimit } from "@workspace/api"

export const searchLimiter = rateLimit({
  bucket: "search",
  limit: 60,
  window: "1m",
  key: ({ context }) => context.user?.id ?? context.ip,
})`,
}

const auditLogFile: ApiBackendsPillarSnippet = {
  tabName: "audit-log.ts",
  lang: "typescript",
  code: `import { audit } from "@workspace/contracts"

export const recordRefund = (input: { invoiceId: string; actorId: string }) =>
  audit.record({
    action: "refund",
    actor: input.actorId,
    resource: input.invoiceId,
    metadata: { reason: "customer-request" },
  })`,
}

const openapiGenFile: ApiBackendsPillarSnippet = {
  tabName: "openapi-gen.ts",
  lang: "typescript",
  code: `import { generateOpenAPI } from "@orpc/openapi"
import { router } from "./router"

export const writeSpec = async (path: string) => {
  const spec = await generateOpenAPI(router, {
    info: { title: "Service API", version: "1.0.0" },
  })
  await Bun.write(path, JSON.stringify(spec, null, 2))
}`,
}

const pgmemTestFile: ApiBackendsPillarSnippet = {
  tabName: "pgmem-test.ts",
  lang: "typescript",
  code: `import { test, expect } from "vitest"
import { newDb } from "pg-mem"
import { listInvoices } from "@workspace/database"

test("listInvoices returns the rows for the org", async () => {
  const db = newDb().adapters.createPg()
  await db.none(\`CREATE TABLE invoices (id text, org_id text)\`)
  const rows = await listInvoices(db, { orgId: "org_1" })
  expect(rows).toEqual([])
})`,
}

const serviceTokenFile: ApiBackendsPillarSnippet = {
  tabName: "service-token.ts",
  lang: "typescript",
  code: `import { issueServiceToken } from "@workspace/auth"

export const mintToken = (serviceId: string) =>
  issueServiceToken({
    serviceId,
    scopes: ["invoices:read"],
    ttlSeconds: 3600,
  })`,
}

const otelWaterfallFile: ApiBackendsPillarSnippet = {
  tabName: "otel-waterfall.ts",
  lang: "typescript",
  code: `import { trace } from "@opentelemetry/api"

const tracer = trace.getTracer("api")

export const withTrace = <T>(name: string, fn: () => Promise<T>) =>
  tracer.startActiveSpan(name, async (span) => {
    try {
      return await fn()
    } finally {
      span.end()
    }
  })`,
}

export const API_BACKENDS_SNIPPETS: Record<ApiBackendsPillarSlug, ApiBackendsPillarTool> = {
  "orpc-router":      { files: [orpcRouterFile] },
  "drizzle-schema":   { files: [drizzleSchemaFile] },
  "rate-limit":       { files: [rateLimitFile] },
  "audit-log":        { files: [auditLogFile] },
  "openapi-gen":      { files: [openapiGenFile] },
  "pgmem-test":       { files: [pgmemTestFile] },
  "service-token":    { files: [serviceTokenFile] },
  "otel-waterfall":   { files: [otelWaterfallFile] },
}
