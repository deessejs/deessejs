/**
 * Code snippets that the homepage LatestGuides carousel renders inside
 * each card's rotated hero block. One short TypeScript sample per KB
 * guide — the snippet illustrates the subject of the guide.
 *
 * Snippets are illustrative, not literal excerpts from the guide body:
 * they show the public-API shape the guide teaches (import paths, the
 * one or two calls that constitute the lesson). When the corresponding
 * package API changes, update the matching entry here.
 *
 * Snippets stay short on purpose: the carousel hero is `aspect-video`
 * (about 9:5), with the rotated block clipped by `overflow-hidden`.
 * Aim for 6-9 lines so the snippet fills the block legibly at lg+ and
 * stays readable on mobile after the rotation.
 *
 * Server-only: this module is imported by <LatestGuides> (a Server
 * Component) which calls `shiki.codeToHtml` on each entry before
 * passing the highlighted HTML strings into the <LatestGuidesSection>
 * Client wrapper. Never imported from a Client Component.
 */

export type LatestGuidesSlug = keyof typeof LATEST_GUIDES_SNIPPETS

export type LatestGuidesSnippet = {
  /** TypeScript source, 6-9 lines. Rendered through Shiki server-side. */
  code: string
  /** Stable class on the rendered hero (used for test selectors). */
  dataSlot?: string
}

export const LATEST_GUIDES_SNIPPETS = {
  "install-deessejs-cli": {
    code: `npm install -g deessejs
deessejs init my-app --template nextjs-saas
deessejs dev`,
  },
  "first-agent-stack": {
    code: `import { defineAgent } from "@deessejs/agent"
import { createDRPCClient } from "@deessejs/drpc"

export const summariser = defineAgent({
  name: "summariser",
  transport: createDRPCClient({ endpoint: env.DRPC_URL }),
  tools: [summariseTool, classifyTool],
})`,
  },
  "nextjs-rag-template": {
    code: `import { createRetrievalPipeline } from "@deessejs/rag"

const pipeline = createRetrievalPipeline({
  store: pgvector("articles"),
  embed: openai("text-embedding-3-small"),
  rerank: cohere("rerank-english-v3.0"),
})

const hits = await pipeline.query("how does auth work?")`,
  },
  "deploy-to-vercel": {
    code: `import { defineConfig } from "@deessejs/config"

export default defineConfig({
  deploy: { target: "vercel", region: "fra1" },
  env: { DATABASE_URL: "vercel-postgres://…" },
  build: { command: "pnpm build" },
})`,
  },
  "observability-logging": {
    code: `import { trace, span } from "@deessejs/observability"

export const handleRequest = trace("http", async (req) =>
  span("auth.check", async () => ensureUser(req)),
)`,
  },
  "postgres-migrations": {
    code: `import { defineSchema, table, col } from "@deessejs/database"

export default defineSchema({
  users: table({
    id: col.uuid().primary(),
    email: col.text().unique(),
    createdAt: col.timestamp().defaultNow(),
  }),
})`,
  },
  "background-jobs-queue": {
    code: `import { defineQueue, worker } from "@deessejs/jobs"

export const sendEmail = defineQueue("send-email")

worker(sendEmail, async (job) => {
  await resend.emails.send({
    to: job.to,
    subject: job.subject,
  })
})`,
  },
  "shadcn-theming": {
    code: `:root {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.18 0 0);
  --border: oklch(0.92 0 0);
  --accent: oklch(0.96 0.02 240);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}`,
  },
  "production-checklist": {
    code: `// before launching
await checks.verify([
  checks.secrets.env(),
  checks.db.migrations(),
  checks.billing.stripeWebhook(),
  checks.auth.rateLimit(),
  checks.queue.dlqDrained(),
])`,
  },
} as const satisfies Record<string, LatestGuidesSnippet>
