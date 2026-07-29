# DeesseJS — Competitive Teardowns

> **Per-competitor deep-dive.** The research summaries in [[reference-template-competitors]] and [[project-market-research-2026-06]] have the high-level data; this is the depth that goes into the buyer-comparison page on the landing site and the strategic notes for each.

## Threat levels

| Competitor | Direct threat | Why |
|---|---|---|
| **supastarter** | 🔴 High | Competes on the same "completeness" axis as DeesseJS. Same Next.js stack. Same $299-999 band (their €349/€799/€1,499 ≈ same range). Their config-driven multi-tenancy toggles give them partial DX too. |
| **ShipFast** | 🟡 Medium | Not complete, but $199-299 is a price-shopping magnet. Buyers who don't know better will compare on price first. |
| **Makerkit** | 🟡 Medium | Three parallel stacks is a real (confusing) differentiator. Mature ecosystem, well-known in the SaaS template space. |
| **SaasRock** | 🟢 Low (adjacent) | Remix / RR7, not Next.js. Deep RBAC is impressive but the audience overlap is partial. Worth learning from, not directly fighting. |
| **TurboStarter** | 🟡 Medium | Multi-app (web + mobile) is a real feature. Pricing in our band. |
| **Nexty / nextforge** | 🟢 Low | Below the price band at $188. Multi-modal demos are interesting but the product is less complete. |

## supastarter 🔴

- **URL:** https://supastarter.dev/
- **Pricing:** €349 / €799 / €1,499 (Solo / Pro / Agency) — one-time, lifetime updates
- **Stack:** Next.js
- **AI depth:** Vercel AI SDK chat with text/image/audio model support, streaming, history. Dev-side: ships AGENTS.md, claude.md.

### Strengths
- **Positioning:** "The most complete Next.js SaaS boilerplate" — they're already claiming our axis
- **Brand:** mature, well-known in the indie / SaaS template space
- **Config-driven multi-tenancy:** ships real config flags for org behavior (enabled, requireOrganization, hideOrganization, enableUsersToCreateOrganizations, etc.)
- **AI is integrated, not bolted-on:** native Vercel AI SDK with structured output

### Weaknesses
- **The completeness claim is the same as ours** — they win on first-mover on the phrase, but we win on the modular promise they don't make
- **AI is shallow:** no RAG, no vector DB, no observability, no evals, no cost tracking
- **Positioning-only DX:** config flags are good, but the buyer can't easily delete a feature
- **Higher entry price (€349 vs our $299):** small but real

### What we can learn
- The config-flag pattern for multi-tenancy is good. We can do similar.
- Their positioning language ("serious founders", "optimized for AI coding agents") is fine but not great. We can write better copy.
- The buyer-voice data showed they have a real Q&A presence on Product Hunt. We should plan for the same.

### Our differentiator
**"The only complete one that doesn't force an architecture on you."** supastarter is complete AND has config flags, but the modules aren't truly deletable. Our "delete what you don't need" walkthrough is the proof.

## ShipFast 🟡

- **URL:** https://shipfa.st/
- **Pricing:** $199 / $249 / $299 (Starter / All-in / Premium) — one-time, lifetime updates
- **Stack:** Next.js
- **AI depth:** Zero native LLM modules. One privacy-policy GPT prompt. Marketing claim: "Cursor / Copilot / Claude / GPT context for code generation."

### Strengths
- **Price:** $199 is the lowest in the band
- **Distribution:** Marc Lou's personal brand (135k Twitter), "Product Hunt Maker of the Year 2023", 8,330 self-reported makers, 5,000+ Discord
- **Speed to ship:** the lean-by-design philosophy is real
- **Auth done simply:** Google OAuth + Magic Links (no RBAC, no orgs)

### Weaknesses
- **No features beyond the absolute basics:** no orgs, no RBAC, no billing (buyer wires their own), no docs site, no blog, no CLI
- **No AI depth:** even the privacy-policy GPT prompt is a "we did this once" feature, not a system
- **Distribution moat is one-person:** can't be replicated
- **The "fast to ship" promise wears off at month 2** when the buyer hits the limits

### What we can learn
- The "ship in a weekend" positioning works for the indie segment
- We should NOT try to copy the distribution — that's Marc Lou's personal brand
- The "no RBAC" gap is real: many buyers want real orgs from day 1

### Our differentiator
**"ShipFast is fast to start. DeesseJS is fast to start AND has the features you'll need by month 2."** The price-shopping buyer is not our target. The buyer who has tried ShipFast and outgrown it is.

## Makerkit 🟡

- **URL:** https://makerkit.dev/
- **Pricing:** $299 / $599 (Pro / Teams) — one-time, lifetime updates
- **Stack:** Next.js with three parallel stacks: Supabase, Drizzle + Better Auth, Prisma 7 + Better Auth
- **AI depth:** Dev-side only. MCP Server (12 → 56 tools in v2.0), AI agent rules. No end-user LLM features.

### Strengths
- **Three parallel stacks:** real choice for buyers with different preferences
- **Mature ecosystem:** well-known, established community
- **DX investments:** MCP server + AI agent rules are real productivity tools
- **Pricing in our band**

### Weaknesses
- **Three parallel stacks = three codebases to maintain.** Buyer confusion: which stack do I pick?
- **No end-user AI:** the AI story is dev-side only
- **No orgs / RBAC as a first-class story:** Better Auth is there but the org story isn't prominent
- **No docs site / blog as a feature**

### What we can learn
- The "three stacks" pattern solves a real problem (different buyer preferences) but creates a different problem (choice paralysis)
- We can pick **one** stack (Drizzle + Better Auth) and own it, with clear "swap to X" docs
- MCP server + AI agent rules are good dev-side AI; we should ship equivalent

### Our differentiator
**"One opinionated stack, not three. Pick the right one once, then ship."** The Makerkit buyer spends time choosing. The DeesseJS buyer spends time shipping.

## SaasRock 🟢 (adjacent)

- **URL:** https://saasrock.com/
- **Pricing:** $249 / $499 / $1,999 (MVP / Corp / Enterprise) — one-time, lifetime updates
- **Stack:** Remix / React Router v7 (NOT Next.js)
- **AI depth:** Knowledge Base with AI suggestions, v1.7.0 Chatbot with OpenAI-only Prompt Flow Builder

### Strengths
- **Deepest RBAC in the band:** 6 default roles, 30 permissions, Admin/App/Custom permission types, Impersonation, IP Blacklist, GDPR management
- **Completeness:** ships a lot (admin, billing, blog, marketing pages)
- **Multi-tenant ready:** built for B2B SaaS

### Weaknesses
- **Remix, not Next.js:** the buyer has to know Remix or learn it
- **OpenAI-only AI:** the AI story is locked to one provider
- **No modular promise:** can't easily delete features
- **Maker's own admission:** "no coding or architecture standards", "No security tests!" (per the buyer-voice research)
- **Documentation is OK but not great** (per the buyer-voice research)

### What we can learn
- The RBAC depth is a target — we should match or exceed (≥ 4 roles, fine-grained perms, impersonation, audit log)
- The "no architecture standards" admission is the buyer's #1 complaint; we should ship architecture standards visibly
- Multi-tenant is a real ask; we can document the path from single-tenant (our default) to multi-tenant (what the buyer builds)

### Our differentiator
**"SaasRock's RBAC depth on Next.js, with architecture standards and a modular promise."** Direct, on Next.js (not Remix), and we don't ship without coding standards.

## TurboStarter 🟡

- **URL:** https://turbostarter.dev/
- **Pricing:** $249 / $399 — one-time, lifetime updates
- **Stack:** Next.js (multi-app: web + mobile)
- **AI depth:** "AI Kit" — multiple providers, tool calling, memory, rate-limiting, credits

### Strengths
- **Multi-app:** ships both web and mobile, which is rare
- **AI Kit is real:** providers, tool calling, memory — more than most competitors
- **Pricing is in our band**
- **Code-first job system**

### Weaknesses
- **Multi-app is a big surface to maintain:** two apps to keep in sync
- **AI Kit is still shallow:** no RAG, no observability, no evals
- **No CLI as a product feature**
- **No white-label / multi-tenant story**

### What we can learn
- The "AI Kit" with tool calling + memory is a real pattern; we should ship equivalents (and go deeper: structured output as first-class)
- Multi-app is interesting but doubles the build cost; we should consider it for v2

### Our differentiator
**"TurboStarter ships web + mobile. DeesseJS ships web + docs + blog + CLI + SDK as first-class. Different kinds of completeness."** We're not competing on mobile; we're competing on the total feature surface that the buyer ships.

## Nexty / nextforge 🟢

- **URL:** https://nexty.dev/ / https://nextforge.dev / https://nextjsstarter.io
- **Pricing:** $188 (Pro tier, single SKU, currently a June 2026 promo — regular $256) — below our band
- **Stack:** Next.js
- **AI depth:** Multi-modal demos (chat, text-to-image, image-to-image, video) via Vercel AI SDK

### Strengths
- **Multi-modal demos are real:** buyers can see image gen, video gen in the demo
- **Price:** $188 is the lowest in the Next.js band
- **3-boilerplate bundle:** covers auth, payments, AI, CMS, admin, i18n, analytics, file storage

### Weaknesses
- **No orgs / RBAC marketing:** "zero mentions of organizations, teams, orgs, multi-tenant, team workspaces, RBAC" per the buyer-voice research
- **No CLI as a product feature**
- **Below our price band:** they're competing on price, not on feature depth
- **Single SKU:** no tier structure

### What we can learn
- The bloat-vs-missing tradeoff is exactly what their own buyers articulate (Stain Lu) — this validates our wedge
- Multi-modal demos are a great marketing surface; we can build similar
- The "no orgs" gap is exploitable

### Our differentiator
**"Nexty has multi-modal demos. DeesseJS has multi-modal demos AND real orgs AND real RBAC."** We can match their demo polish and beat them on the org story.

## Non-competitors (do not engage)

- **mrrobot** — no paid product in the band
- **supafast.co** — unreliable, no verified claims
- **create-t3-app** — free, the "what people build for free" baseline. Not a competitor; a complement.
- **vercel examples / next.js examples** — free, official. Not competitors.

## Strategic notes

1. **The wedge is contested, not uncontested.** supastarter is on the same axis. We have to be sharper ("the only complete one that's truly modular") to differentiate.
2. **No one owns the "modular" claim with proof.** This is our shot. Document it, test it, demo it.
3. **ShipFast's distribution is a one-person moat.** Don't try to copy it. Build our own distribution (Product Hunt + IH + X + SEO).
4. **SaasRock's RBAC depth is a target.** ≥ 4 roles with fine-grained perms, impersonation, audit log. Match their depth.
5. **The "no architecture standards" admission from SaasRock's maker is gold for our copy.** It names the gap we close.

## Cross-references

- README: [`README.md`](./README.md) — high-level product brief
- Architecture: [`architecture.md`](./architecture.md) — stack + modular contract
- Positioning: [`positioning.md`](./positioning.md) — brand + wedge + copy
- Pricing: [`pricing.md`](./pricing.md) — pricing strategy
- Research: [`research.md`](./research.md) — research summary
- Memory: [[reference-template-competitors]] — high-level competitor set
