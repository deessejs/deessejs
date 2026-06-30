---
name: project-2026-saas-template-landscape
description: 2026 competitive landscape for DeesseJS — Supastarter / MakerKit / AnythingShip / ShipFast status, MCP adoption curve, content engine trends, strategic white space
metadata:
  type: project
---

# 2026 SaaS template landscape — strategic snapshot

**Date:** 2026-06-26
**Source:** Deep research via `fresh` CLI (Exa.ai) — see full report in agent conversation transcript.
**Why this matters:** DeesseJS's positioning choices in M2-M6 depend on where the competitive set is heading. Forking vs building-from-scratch decisions in M3+ need this context.

## TL;DR — the bifurcation

The 2026 SaaS template market has split into two camps:

| Camp | Examples | Pitch |
|---|---|---|
| **Agent-first launchpads** | Supastarter, MakerKit AnythingShip | "MCP server, agent-readable routes, structured data baked in" |
| **Content-first launchers** | ShipFast, MakerKit BlogPress | "SEO blog, newsletter capture, churn-resistant monetization" |

**DeesseJS's white space:** "Agent-first + content-first + no lock-in" = Supastarter's MCP story + ShipFast's content plumbing + portable Drizzle/Postgres data layer.

## Template-by-template status (June 2026)

### Supastarter — the technical winner
- **v3.x** shipped Q1 2026, native MCP server (`@supastarter/mcp`)
- Stack: Next.js App Router, TS, Tailwind, Drizzle, tRPC, Better Auth, Stripe + Lemon Squeezy, Postgres
- $299 one-time + $99/yr updates; Team $799
- **Watch:** MCP integration is shallow — exposes resources but write-tools (create-checkout-session) still TBD
- **Risk:** First-mover in MCP, but they're evolving fast — DeesseJS can leapfrog with deeper agent surfaces

### MakerKit — slow but steady
- Two product lines: MakerKit AppKit + MakerKit BlogPress (Substack clone)
- Stack: Next.js/Remix dual, TS, Tailwind, shadcn/ui, Drizzle/Prisma, Stripe + Paddle
- $299 + $99/yr (AppKit); $199 (BlogPress)
- **Watch:** Started licensing their auth + billing as standalone SDK — potential Clerk competitor
- **Not a wedge for DeesseJS:** their multi-tenant story is good but commoditizing

### AnythingShip — dark horse (Convex lock-in)
- Stack: Next.js, TS, Tailwind, **Convex**, Clerk, Stripe
- Reactive agent UIs via Convex websockets
- $199 + $49/yr
- **Risk:** Convex's BSL has changed twice in 18 months — portability matters
- **Verdict for DeesseJS:** Don't compete on this axis; ship Drizzle/Postgres as portable alternative

### ShipFast — plateauing
- Marc Lou's product, lifetime-deal culture
- Stack: Next.js, TS, Tailwind, Prisma, NextAuth/Auth.js, Stripe, Resend
- $199 + $49/yr
- **No MCP, no agent features.** Pure growth-in-a-box (SEO blog, transactional email, A/B pricing variants)
- **Watch:** Under pressure to add agent features — contradiction with their existing positioning

## MCP adoption — the curve to watch

- **Late 2024:** Anthropic ships MCP
- **2025:** OpenAI adopts compatible transport; Google in beta
- **Mid-2026:** **de facto standard.** ~40% of top-100 YC W25 batch ships an MCP server alongside their app

**Production gotchas:**
- Tool descriptions are the prompt — vague = hallucinated calls. Supastarter spends ~200 tokens per tool on description + examples
- Stream long-running ops via `Streamable HTTP` transport (not legacy SSE)
- Most MCP clients cache tool lists — design for graceful drift when schemas change

**For DeesseJS by H2 2026:** "does your app have an MCP server?" becomes a default buyer question, like "does it have a mobile app?" was in 2014. **MCP is now P0 for M2-M3 roadmap.**

## Content engine trends — typed + agent-readable

**The 2026 pattern:** typed MDX frontmatter (Zod schema) + JSON-LD output at render time.

```ts
// Example pattern
const post = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    publishedAt: z.coerce.date(),
    tags: z.array(z.string()),
    ogImage: z.string().url(),
  }),
});
// At render: <script type="application/ld+json">{...}</script>
```

Why: SEO + agent ingestion. Both consumers want structured data.

**What DeesseJS should ship:**
- Typed content collections (✅ already done — content-collections + Zod)
- JSON-LD output at render (🟡 done for blog posts, missing for releases)
- RSS + JSON Feed (✅ RSS done, JSON Feed missing)

## Newsletter + RSS — the 2026 stack

**Hybrid pattern winning in 2026:**
1. Markdown blog (SEO surface)
2. **JSON Feed + RSS** (agent + power-user subscription)
3. Newsletter via Resend (one-way broadcast, weekly digest)
4. Web push via OneSignal (optional, for power users)

**Supastarter and MakerKit BlogPress both ship this. ShipFast does not.**

**For DeesseJS:** we have RSS. Adding JSON Feed is ~30 min of work (the JSON Feed v1.1 spec is trivial). **Worth doing now while we're fresh on the RSS infrastructure.**

## Newsletter vendor landscape

- **Substack** — dominant for indie writers but increasingly hostile to multi-author. ~10% fee.
- **Ghost** — "Substack without Substack." Self-host or hosted. Now ships ActivityPub.
- **beehiiv** — best growth tools, worst writing UX
- **Kit (ConvertKit)** — best for creators selling products
- **Resend + own list** — preferred by technical founders. No vendor lock-in.

**For DeesseJS:** the user already chose Resend (per memory). **Resend + own list is the right call.** Don't recommend Substack/beehiiv — they're vendor lock-in, opposite of DeesseJS's wedge.

## What DeesseJS should NOT do

- ❌ Don't fork any template — all 4 are converging on the same surface; the IP is in agent integrations + content schema
- ❌ Don't ship a workflow canvas unless the product actually needs one (expensive to build correctly)
- ❌ Don't bet on Convex (license instability)
- ❌ Don't ignore MCP — by H2 2026 it's a buyer default question

## What DeesseJS SHOULD do (priority order)

### P0 — Foundational (M1-M2)
1. ✅ Typed content collections (DONE — content-collections + Zod)
2. ✅ RSS feed (DONE — `apps/web/src/lib/blog/feed.ts`)
3. 🟡 JSON-LD at render (PARTIAL — blog post [slug] has it, release pages missing)
4. ❌ JSON Feed alongside RSS (NOT DONE — ~30 min of work)
5. ❌ MCP server (NOT DONE — biggest open wedge)

### P1 — Agent surface (M3-M4)
6. ❌ MCP server for DeesseJS itself (auth, billing, jobs, storage resources)
7. ❌ `/.well-known/mcp.json` discovery file
8. ❌ Streaming tool results (Streamable HTTP transport)
9. ❌ Idempotency keys on write tools (DB-enforced)

### P2 — Differentiation (M5+)
10. ❌ Decision: command-K agent vs workflow canvas (don't ship both)
11. ❌ Tool description quality bar (150-300 tokens per tool)
12. ❌ Structured-data snapshot tests (agents are unforgiving consumers)

## How to apply

- **Pitching DeesseJS:** lead with MCP-by-default + agent-readable content + portable data layer. That's the white space.
- **M2-M3 planning:** allocate ~2 weeks to MCP server prototype before committing to RBAC/billing. The agent surface is the wedge.
- **Content engine:** keep content-collections (validated choice). Add JSON-LD to releases. Add JSON Feed (~30 min).
- **Avoid in recommendations:** Convex (license), Substack/beehiiv (vendor lock-in), workflow canvas (premature).

## Related memory

- `reference-content-collections-next16-patterns.md` — the implementation reference for the blog/changelog engine
- `project-blog-engine-decision-2026-06-26.md` — why content-collections over Velite/fumadocs/next-mdx-remote
- `reference-content-collections-next16-mdx-wrapper.md` — the MDXContent client wrapper fix for Next 16 RSC

## Open questions for the user

1. **Auth for MCP server:** Better Auth (Supastarter pattern) or stay with what we have? Recommendation: Better Auth for portability.
2. **Hosting for MCP server:** Vercel functions (limited timeout) or Cloudflare Workers (better for long-running ops)? Recommendation: Cloudflare.
3. **Agent client optimization:** Claude/Cursor only, or also OpenAI/Google agent SDKs? Affects transport choice.
4. **JSON Feed priority:** ship now (cheap) or defer to M3? Recommendation: ship now.