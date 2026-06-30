---
name: project-mcp-research-2026-06-29
description: Verified 2026 state of MCP (Model Context Protocol) — dominant open standard backed by Anthropic+OpenAI+VS Code+Cursor, vendor-neutral governance, 2026-01-26 spec alive. Canonical Next.js/Hono/TypeScript stack is FastMCP. Better Auth MCP plugin is deprecated; OAuth Provider Plugin at /oauth2/* is the path. TurboStarter is the only commercial template competitor shipping MCP. shadcn ships a narrow registry-browse MCP server. Recommendation: ship MCP narrowly, two servers (SaaS-operator HTTP/OAuth + scaffolding STDIO), FastMCP-based.
metadata:
  type: project
---

# MCP for DeesseJS — deep research 2026-06-29

User asked: should DeesseJS ship MCP tooling, and if so, what specifically? Deep-research workflow: 5 angles, 101 agent calls, 14/25 claims confirmed.

## 8 confirmed findings

1. **MCP is the dominant open standard in 2026** — Anthropic (Claude), OpenAI (ChatGPT Apps/Connectors + Deep Research), VS Code, Cursor all back it. Governance moved vendor-neutral. Spec revision 2026-01-26 is alive and evolving.
2. **Three build paths** — servers, clients, MCP Apps (sandboxed iframe via postMessage, @modelcontextprotocol/ext-apps SDK).
3. **Canonical auth: OAuth 2.1 + PKCE + RFC stack** — RFC 8707 (audience binding, MUST), RFC 7591 (DCR), RFC 8414 (auth server metadata), RFC 9728 (protected resource metadata). Authorization OPTIONAL overall, mandatory for HTTP transports, NOT recommended for STDIO (creds from env).
4. **Better Auth MCP plugin is deprecated** — `better-auth/plugins/mcp` exists but slated for deprecation. **OAuth Provider Plugin** is the replacement, endpoints migrated from `/mcp/*` to `/oauth2/*`. Build against the new endpoints.
5. **Canonical Next.js/Hono/TypeScript stack is FastMCP** — framework built on official SDK, Hono internally, ships EdgeFastMCP for Cloudflare Workers/Deno Deploy. OAuth 2.1 Proxy bundled with AES-256-GCM token-swap, DCR, PKCE, tool-level authz helpers (requireAuth, requireScopes, requireRole, requireAll, requireAny). Alternative: @modelcontextprotocol/hono official adapter.
6. **TurboStarter is the ONLY commercial template competitor shipping MCP** — Core Kit $299, paired with @turbostarter/cli npm package + MCP docs page + AI-editor rules for Cursor/Claude Code/Codex/Antigravity/Windsurf/Copilot/Replit/Zed. supastarter, Makerkit, ShipFast, SaasRock, Nexty: nothing.
7. **shadcn ships a first-party narrow MCP server** — 7 tools (get_project_registries, list/search/view items, get examples, get add commands, audit checklist). Scope: browse/search/install from registries. NOT project scaffolding, NOT API procedures, NOT Drizzle migrations.
8. **Ecosystem pattern: narrow + distribution-oriented** — MCP servers let agents find/install/preview what your lib offers OR operate against a running SaaS. Not general-purpose scaffolding. Distribution = CLI-launched (registry install, npx-style), not passive npm.

## Refuted / not verified

- Docker MCP Catalog 1M+ pulls / 20M+ reach claims — failed adversarial verification
- modelcontextprotocol/servers repo 87.8k stars / 907 contributors — failed verification
- Better Auth ships drop-in framework adapters for Hono/Express/MCP SDK/mcp-use — failed verification
- MCP "requires" OAuth 2.1 (it's optional, mandatory only for HTTP) — failed
- Better Auth docs-only MCP server at mcp.better-auth.com/mcp — failed verification

## Research gaps (demand-side unverifiable)

- Zero verified buyer demand on Reddit / Indie Hackers / r/nextjs / r/ClaudeAI / Hacker News
- Vendor behavior (TurboStarter, shadcn) used as proxy for demand
- Whether TurboStarter's MCP actually moves conversion (Core Kit tier already $299) is unknown
- Adjacent integrations (Stripe-specific, Resend-specific, Upstash-specific MCP servers) not surveyed

## Recommendation: ship MCP, but narrowly

### Server 1: SaaS-operator MCP (the big win)
- Lets AI agents operate a DeesseJS-built SaaS via OAuth-authenticated MCP
- Tools: stripe.* (list/customers, get/subscription, create/refund), resend.* (send email, list audiences), db.* (Drizzle schema introspection read-only), upstash.* (pub/sub, get state), triggerdev.* (fire/list jobs), auth.* (verify Better Auth session)
- Auth: Better Auth OAuth Provider Plugin, /oauth2/* endpoints, RFC 8707 + PKCE + DCR
- Transport: Streamable HTTP (OAuth mandatory)
- Effort: 3-4 weeks

### Server 2: Template-aware scaffolding MCP (narrow win)
- Lets AI agents scaffold features in a DeesseJS-based project
- Tools: scaffold.api.procedure, scaffold.drizzle.migration, scaffold.form, scaffold.webhook, scaffold.dashboard.page
- Auth: STDIO transport, creds from env
- Inspired by shadcn's narrow pattern — NOT general-purpose scaffolding
- Effort: 2-3 weeks

### What NOT to build
- ❌ General-purpose project-scaffolding agent
- ❌ Dependency on deprecated better-auth/plugins/mcp API
- ❌ Cloud-hosted MCP gateway (FastMCP's EdgeFastMCP is enough)

## Why now (timing)
1. **First-mover window** — TurboStarter is alone. 5 competitors have nothing. Window is 6-12 months.
2. **Stack is mature** — FastMCP solves OAuth + Edge + tool authz out of the box.
3. **Better Auth OAuth Provider is stable** — post-deprecation migration done. Build against /oauth2/*.
4. **Positioning payoff** — "agents are first-class users" becomes demo-able: Claude Code queries DB, fires Trigger.dev job, sends Resend email. Concretizes [[project-positioning-hybrid-2026-06]].
5. **Viral surface** — npm package + glama.ai/mcp.so/Docker MCP catalog presence. Install-on-rails for buyers with Claude Code/Cursor already open.

## Risks (honest)
| Risk | Mitigation |
|---|---|
| Demand not directly verified | Ship Server 1, measure adoption, kill if no traction |
| Spec evolves quarterly | Re-verify every quarter |
| OAuth complexity | FastMCP's OAuth Proxy reduces drastically but needs serious testing |
| First-mover trap | It's an add-on, not the core. Lower downside. |
| Scope creep (general scaffolding temptation) | Hardest decision. Hold the line on narrow scope. |

## Suggested execution order
1. Week 1-2: Spike FastMCP + Better Auth OAuth Provider with one tool (Stripe customer list). Validate end-to-end auth.
2. Week 3-4: Ship Server 1 v0.1 with Stripe + Resend + Drizzle read-only. Publish @deessejs/mcp-server-stripe as first package.
3. Week 5-6: Add Trigger.dev + Upstash. Consolidate as @deessejs/mcp-server (full surface).
4. Week 7-9: Server 2 (scaffolding STDIO) in parallel.
5. Week 10+: Distribution — submit to glama.ai / mcp.so / Docker MCP catalog, blog post, demo video.

Total: ~10 weeks for both servers. Lean v0: 3-4 weeks for Server 1 only.

## Tier-fit consideration (open)

Should Server 1 be a **Pro/Team feature** (gated upgrade) or **included-for-all** (broad adoption)?
- Pro/Team = upgrade driver to top tier, narrower audience
- Included-for-all = viral surface, broader adoption, may commoditize

Related: [[project-positioning-hybrid-2026-06]] (agent-first positioning), [[project-template-market-research-2026-06]] (competitor landscape), [[project-cli-auth-idea-2026-06]] (CLI auth idea — MCP could ship via the same CLI distribution model).