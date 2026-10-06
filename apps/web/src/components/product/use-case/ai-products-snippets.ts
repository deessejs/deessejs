/**
 * AI products pillar code snippets - server-only module.
 *
 * Eight TypeScript samples for the AI products use case
 * (`/use-cases/ai-products`): the four existing clusters
 * (Conversational agent, Tool integration, Knowledge retrieval,
 * Production operations) plus four new "behind the curtain"
 * pillars (Streaming cancel, Citation prompt, Eval scoring,
 * Replay console).
 *
 * Server-only because the consumer pre-highlights the snippets
 * server-side via `codeToHtml`; the strings never ship in the
 * client's JS bundle.
 *
 * Each snippet is illustrative. The real public API of each
 * package may differ once the registry stabilises; trim or
 * adjust each sample as the actual surface lands.
 *
 * Imports use the real monorepo package names: `@workspace/*`.
 */

export type AiProductsPillarSlug =
  | "agent-loop"
  | "typed-tools"
  | "pgvector-search"
  | "otel-trace"
  | "streaming-cancel"
  | "citation-prompt"
  | "eval-scoring"
  | "replay-console"

export type AiProductsPillarSnippet = {
  tabName: string
  lang: "typescript"
  code: string
}

export type AiProductsPillarTool = {
  files: ReadonlyArray<AiProductsPillarSnippet>
}

const agentLoopFile: AiProductsPillarSnippet = {
  tabName: "agent-loop.ts",
  lang: "typescript",
  code: `import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getTools } from "@workspace/contracts"

export const runAgent = (input: { prompt: string }) =>
  streamText({
    model: openai("gpt-4o"),
    prompt: input.prompt,
    tools: getTools("agent-runtime"),
    onFinish: ({ usage, finishReason }) =>
      db.runs.insert({ usage, finishReason, traceId }),
  })`,
}

const typedToolsFile: AiProductsPillarSnippet = {
  tabName: "tools.bridge.ts",
  lang: "typescript",
  code: `import { z } from "zod"
import { listInvoices } from "@workspace/api"
import { tool } from "@workspace/contracts"

export const listInvoicesTool = tool({
  description: "List invoices for an organisation.",
  input: z.object({ orgId: z.string() }),
  handler: listInvoices,
})`,
}

const pgvectorSearchFile: AiProductsPillarSnippet = {
  tabName: "pgvector.index.ts",
  lang: "typescript",
  code: `import { sql } from "drizzle-orm"
import { db } from "@workspace/database"

export const search = async (query: number[], limit = 10) =>
  db.execute(sql\`
    SELECT id, content, embedding <=> \${sql.raw(JSON.stringify(query))} AS distance
    FROM documents
    ORDER BY distance ASC
    LIMIT \${limit}
  \`)`,
}

const otelTraceFile: AiProductsPillarSnippet = {
  tabName: "otel.run-trace.ts",
  lang: "typescript",
  code: `import { trace } from "@opentelemetry/api"
import { emitRunEvent } from "@workspace/contracts"

const tracer = trace.getTracer("agent-runtime")

export const withRunTrace = <T>(runId: string, fn: () => Promise<T>) =>
  tracer.startActiveSpan("agent.run", async (span) => {
    span.setAttribute("run.id", runId)
    const result = await fn()
    emitRunEvent({ runId, status: "ok" })
    span.end()
    return result
  })`,
}

const streamingCancelFile: AiProductsPillarSnippet = {
  tabName: "streaming-cancel.ts",
  lang: "typescript",
  code: `import { streamText } from "ai"

export const runCancellable = (signal: AbortSignal) =>
  streamText({
    model: openai("gpt-4o"),
    prompt: "...",
    abortSignal: signal,
    onAbort: () => cleanup(),
  })`,
}

const citationPromptFile: AiProductsPillarSnippet = {
  tabName: "citation-prompt.ts",
  lang: "typescript",
  code: `export const buildPrompt = (
  question: string,
  chunks: Array<{ id: string; text: string }>,
) => \`Answer using only the chunks below. Cite each chunk id
inline in brackets.

\${chunks
  .map((c, i) => \`[\${i + 1}] (id=\${c.id}) \${c.text}\`)
  .join("\\n\\n")}

Q: \${question}\``,
}

const evalScoringFile: AiProductsPillarSnippet = {
  tabName: "eval-scoring.ts",
  lang: "typescript",
  code: `import { runEval } from "@workspace/contracts"

export const gradeAgent = (runId: string) =>
  runEval({
    runId,
    graders: ["answer-relevance", "grounding", "tool-correctness"],
    budgets: { tokens: 8000, costUsd: 0.40 },
  })`,
}

const replayConsoleFile: AiProductsPillarSnippet = {
  tabName: "replay-console.ts",
  lang: "typescript",
  code: `import { loadRun } from "@workspace/contracts"

export const replayFromTrace = async (traceId: string) => {
  const run = await loadRun(traceId)
  return runAgent({
    prompt: run.input.prompt,
    tools: run.input.tools,
    seed: run.input.seed,
  })
}`,
}

export const AI_PRODUCTS_SNIPPETS: Record<AiProductsPillarSlug, AiProductsPillarTool> = {
  "agent-loop":         { files: [agentLoopFile] },
  "typed-tools":        { files: [typedToolsFile] },
  "pgvector-search":    { files: [pgvectorSearchFile] },
  "otel-trace":         { files: [otelTraceFile] },
  "streaming-cancel":   { files: [streamingCancelFile] },
  "citation-prompt":    { files: [citationPromptFile] },
  "eval-scoring":       { files: [evalScoringFile] },
  "replay-console":     { files: [replayConsoleFile] },
}
