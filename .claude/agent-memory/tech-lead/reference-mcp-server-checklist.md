---
name: reference-mcp-server-checklist
description: MCP server checklist for DeesseJS — what to ship in M2-M3 to be "agent-first" in 2026, with production gotchas and the .well-known/mcp.json discovery convention
metadata:
  type: reference
---

# MCP server checklist for DeesseJS (2026)

MCP (Model Context Protocol) is the de facto standard for agent-tool integration in 2026. ~40% of top-100 YC W25 cohort ships an MCP server alongside their app. DeesseJS's competitive wedge depends on shipping this in M2-M3.

## Why this matters

By H2 2026, "does your app have an MCP server?" is a default buyer question, like "does it have a mobile app?" was in 2014. DeesseJS's positioning is "agent-first" — without MCP, the wedge collapses to "template with docs."

## Reference implementations worth studying

- `modelcontextprotocol/servers` — Anthropic's official examples (GitHub, Postgres, Filesystem)
- `@supastarter/mcp` — Supastarter's app-specific MCP server (cleanest 2026 example)
- Cloudflare's MCP server template — best for edge-deployed agents

## P0 — Ship in M2

### 1. The discovery file
Every agent-first app ships `/.well-known/mcp.json`. Convention:

```json
{
  "name": "DeesseJS",
  "description": "The SaaS template that never sleeps",
  "endpoints": {
    "stdio": { "command": "npx @deessejs/mcp-server" },
    "http": { "url": "https://deessejs.com/api/mcp" }
  },
  "capabilities": ["resources", "tools", "prompts"],
  "version": "1.0.0"
}
```

### 2. Read-only resources (start here)
Expose existing app entities as discoverable resources:

- `deessejs://posts/{slug}` — blog post metadata + body
- `deessejs://releases/{version}` — release notes
- `deessejs://docs/{path}` — documentation pages
- `deessejs://pricing` — current pricing tiers

**Why start with read-only:** zero risk of unintended side-effects. Agents can browse without write-permission concerns.

### 3. Auth-scoped write tools (after read-only is stable)
Gate write tools by Better Auth user context. Same MCP server, different tool allowlist per role:

- **Owner:** all tools (create-checkout, manage-billing, etc.)
- **Admin:** all tools minus billing-destroy
- **Member:** create-resource, update-own-resource, read-all
- **Anonymous:** read-only resources

Implementation pattern: wrap `mcpServer.tool(...)` in a `requireAuth(role)` middleware that pulls auth context from the request headers.

### 4. Idempotency keys on every write tool

Agent SDKs retry aggressively. Without idempotency, you double-charge.

```ts
server.tool("create-checkout", {
  idempotency_key: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  // ...
}, async ({ idempotency_key, ...args }, ctx) => {
  // Check if (idempotency_key, user_id) is already processed
  const existing = await db.idempotency.findUnique({
    where: { key: `${ctx.userId}:${idempotency_key}` },
  });
  if (existing) return existing.result;
  // Otherwise process + store
  const result = await processCheckout(args);
  await db.idempotency.create({ data: { key: ..., result } });
  return result;
});
```

Enforce at DB layer with a unique index — application checks are belt-and-suspenders.

## P1 — Production hardening

### 5. Tool description quality bar
Tool descriptions ARE the prompt. Vague = hallucinated calls.

**Bar:** 150-300 tokens per tool. Include:
- What it does (1 sentence)
- When to use it (1 sentence with example trigger)
- Inputs (semantic, not just type — "amount in cents, not dollars")
- Output shape (what the agent gets back)
- Failure modes (what 4xx/5xx mean)

**Example, bad:**
```ts
server.tool("create-billing", { amount: z.number() }, ...)
// Description: "Creates a billing entry."
```

**Example, good:**
```ts
server.tool("create-billing", {
  amount_cents: z.number().int().positive().describe("Amount in cents (not dollars). e.g. $10.00 = 1000"),
  customer_id: z.string().describe("Customer's Better Auth user ID. Get from deessejs://users/{handle}"),
  description: z.string().max(280).describe("What the customer is paying for. Shown on invoice."),
}, ...)
// Description: "Creates a one-time billing entry in the user's account. Returns the invoice URL. Use this when the user explicitly asks to bill a customer. Do NOT use for subscription billing — use 'create-subscription' instead. Idempotent: pass the same idempotency_key to safely retry."
```

### 6. Streaming long-running operations

Anything >1s should stream partial progress. **Use `Streamable HTTP` transport (not legacy SSE).** Cloudflare Workers + MCP = streaming for free (they have first-class Streamable HTTP support).

Pattern: tool returns SSE stream of `{ progress, partial_result }` events. Agent client receives progress, can show in UI.

### 7. Graceful tool-list drift
Most MCP clients cache tool lists. When you ship a new tool or change a schema:

- **Don't:** silently rename or remove tools — clients keep calling the old name
- **Do:** add new tools, deprecate old ones with `deprecated: true` flag, remove after 6+ months
- **Do:** version the MCP server (`@deessejs/mcp-server@1.2.0`) — clients can pin versions

## P2 — Differentiators (after M3)

### 8. Prompts as first-class
MCP supports "prompts" (templated user-facing prompts). For DeesseJS:

- `onboard-new-user` — template for guiding a new user's first 5 minutes
- `upgrade-to-pro` — template for the sales conversation
- `debug-billing-issue` — template for support escalation

This puts us ahead of Supastarter (which doesn't ship prompts).

### 9. MCP-aware analytics
Track which MCP tools get called most, by which client (Claude, Cursor, etc.), with what success rate. This data is gold for prioritization.

## Hosting decision (open question)

| Platform | Pros | Cons |
|---|---|---|
| **Vercel functions** | Easiest deploy, already in stack | 10s timeout (need streamable HTTP for >1s ops) |
| **Cloudflare Workers** | Native streaming, no timeout | New infra to maintain |
| **Self-hosted (Fly/Railway)** | Full control | More ops burden |
| **MCP-specific service (e.g. Smithery)** | Zero infra | Vendor lock-in (anti-DeesseJS wedge) |

**Recommendation:** Cloudflare Workers for production MCP server, Vercel functions for dev/preview. Different runtime = simpler to reason about.

## Anti-patterns to avoid

- ❌ **Marketing-only MCP** — "we have an MCP server" with no actual tool integration. Buyers will probe and find empty.
- ❌ **Unscoped write tools** — `admin_delete_user` available to anonymous agents. Always gate by role.
- ❌ **No error recovery** — workflow canvas with one failed node killing the run. Always provide resume paths.
- ❌ **Vague tool descriptions** — agent SDKs hallucinate when prompts are weak. 150-300 tokens per tool, non-negotiable.

## Effort estimate

| Phase | Effort | Risk |
|---|---|---|
| P0 (discovery + read-only resources) | 1-2 weeks | Low |
| P1 (write tools + idempotency + streaming) | 2-3 weeks | Medium |
| P2 (prompts + analytics + cloudflare deploy) | 2-3 weeks | Medium |
| **Total** | **5-8 weeks for full agent surface** | — |

## How to apply

- When asked "what's next after M1?" — push for MCP server over more RBAC/billing features. It's the wedge.
- When asked about hosting for new features — flag Cloudflare as the right choice for MCP (streaming), Vercel for everything else.
- When picking auth provider — Better Auth is the Supastarter pattern and integrates cleanly with MCP scoping.
- When asked about Convex — decline, cite license instability per `project-2026-saas-template-landscape.md`.

## Related memory

- `project-2026-saas-template-landscape.md` — strategic context for why MCP matters
- `project-blog-engine-decision-2026-06-26.md` — content-collections engine for the resources layer