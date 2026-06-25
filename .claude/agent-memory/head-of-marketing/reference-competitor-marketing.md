---
name: reference-competitor-marketing
description: Per-competitor marketing playbook — their positioning, our differentiator, and the counter-message for the Buyer's Guide and the comparison page
metadata:
  type: reference
---

**supastarter (🔴 high threat)**
- URL: https://supastarter.dev/
- Pricing: €349 / €799 / €1,499 (Solo / Pro / Agency) — one-time
- Their positioning: "The most complete Next.js SaaS boilerplate and starter kit"
- Their edge: brand maturity, config-driven multi-tenancy toggles, "serious founders" framing
- **Our differentiator:** "The only complete one that doesn't force an architecture on you." supastarter ships config flags, not deletable modules. The "Deleting features" walkthrough is the proof.
- Counter in Buyer's Guide: lead with the bloat-vs-missing tradeoff + Stain Lu's "force you into their structure" quote.

**ShipFast (🟡 medium threat — price)**
- URL: https://shipfa.st/
- Pricing: $199 / $249 / $299 (Starter / All-in / Premium)
- Their positioning: "Ship in a weekend", $199-299 lowest in band
- Their edge: Marc Lou's 135k Twitter brand moat, 8,330 self-reported makers, 5,000+ Discord
- **Our differentiator:** "ShipFast is fast to start. DeesseJS is fast to start AND has the features you'll need by month 2." The $100 buys you a dozen features you'd otherwise build.
- Counter in Buyer's Guide: target the post-ShipFast buyer (outgrew it). Don't compete on price.
- Surprise ammunition: ShipFast literally cannot be pushed to GitHub out of the box (~2 hours of workarounds). AI-search is failing them (50/100 schema audit, 200 visitors/month from AI search).

**Makerkit (🟡 medium threat — confusion)**
- URL: https://makerkit.dev/
- Pricing: $299 / $599 (Pro / Teams)
- Their positioning: "Mature ecosystem, three parallel stacks" (Supabase, Drizzle+Better Auth, Prisma 7+Better Auth)
- Their edge: stack choice, MCP server (12→56 tools in v2.0), AI agent rules
- **Our differentiator:** "One opinionated stack, not three. Pick the right one once, then ship." The Makerkit buyer spends time choosing. The DeesseJS buyer spends time shipping.
- Counter in Buyer's Guide: feature parity, but no choice paralysis.

**SaasRock (🟢 adjacent — Remix, not Next.js)**
- URL: https://saasrock.com/
- Pricing: $249 / $499 / $1,999 (MVP / Corp / Enterprise)
- Their positioning: RBAC depth, multi-tenant, B2B SaaS
- Their edge: 6 roles, 30 perms, impersonation, GDPR — the deepest RBAC in the band
- **Our differentiator:** "SaasRock's RBAC depth on Next.js, with architecture standards and a modular promise." The maker's own admission ("no coding or architecture standards", "No security tests!") is gold for our copy.
- Counter in Buyer's Guide: same depth, modern stack (Next.js, not Remix), standards visible.

**TurboStarter (🟡 medium — multi-app)**
- URL: https://turbostarter.dev/
- Pricing: $249 / $399
- Their positioning: "AI Kit + multi-app (web + mobile)"
- Their edge: web + mobile, code-first jobs, AI Kit (providers, tool calling, memory)
- **Our differentiator:** "TurboStarter ships web + mobile. DeesseJS ships web + docs + blog + CLI + SDK as first-class. Different kinds of completeness."
- Counter in Buyer's Guide: web-first vs. multi-app is a tradeoff, not a feature.

**Nexty (🟢 low — below band) — DO NOT CONFLATE WITH NextForge**
- URL: https://nexty.dev/
- Pricing: $188 (Pro tier, single SKU, currently June 2026 promo — regular $256)
- Their positioning: multi-modal demos, $188 lowest in Next.js band
- Their edge: chat / t2i / i2i / video demos
- **Our differentiator:** "Nexty has multi-modal demos. DeesseJS has multi-modal demos AND real orgs AND real RBAC." Exploitable gap: zero mentions of "orgs / teams / RBAC / multi-tenant" in their marketing.
- Counter in Buyer's Guide: same demo polish, beat them on the org story.

**NextForge / vercel/next-forge (🔴 HIGH threat — Vercel halo, free, MIT)**
- URL: https://www.next-forge.com/ · repo: https://github.com/vercel/next-forge
- Pricing: **FREE (MIT license, forever, no paid tier)**
- Creator: Hayden Bleasel — hired by Vercel, now MTS @ OpenAI (potential CoI risk)
- Their positioning: "Production-grade Turborepo template for Next.js apps" — Fast, Cheap, Opinionated, Modern, Safe
- Their edge: **Vercel halo** (first search result on Google for "Next.js SaaS template"), 7.1k stars, 367 releases, free, official template
- Their AI story: `packages/ai` (Vercel AI SDK), `npx skills add vercel/next-forge`, AI Agent Rules for Cursor/Copilot, single-tenant chatbot example
- **Our differentiator:** "NextForge is a free template you download once. DeesseJS is an agent system with per-tenant LLM metering + Stripe metered usage + a Cloud. Free gets you features. Paid gets you a business model."
- Counter in Buyer's Guide: don't attack the free template (loses on optics). Reframe: "if you want to charge your users for what your agents do, you need a system, not a template."
- Full deep-dive: [[competitor-nextforge]]

**Non-competitors (do not engage in comparison page):**
- mrrobot (no paid product in band)
- supafast.co (unreliable, no verified claims)
- create-t3-app (free, complement not competitor)
- Vercel / Next.js examples (free, official)

**Sources:** `documents/internal/product/competitive-teardowns.md`, `documents/internal/product/research.md`, `documents/internal/product/unmet-needs-2026-06.md`. See head-of-product [[reference-template-competitors]] for the verified competitor set.
