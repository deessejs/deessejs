# DeesseJS — Research Findings

> **Summary of the two deep-research passes that informed the product spec.** Full reports are in agent memory (linked below); this is the executive summary.

## Research pass 1: market (2026-06-16)

**Question:** Research the paid Next.js fullstack template market at the $299-999 price point, with a specific lens on AI-first positioning. Competitors, demand, AI features, pricing, distribution, the gap.

**Method:** Deep-research workflow, 103 agents, 21 sources, 25 claims verified, 21 confirmed, 4 refuted.

**Headline:** The $299-999 Next.js template market is **dominated by shallow AI offerings** that position "AI" almost exclusively as developer-side tooling (Cursor, Claude Code, AGENTS.md, MCP servers) rather than end-user LLM features. The clear gap is a template that ships real end-user AI primitives (RAG, vector DB, agent loops, observability, evals, cost tracking) without abandoning the developer-AI tooling story.

**Verified competitors (Next.js, in-band):**

| Name | Price | AI depth | What they win on |
|---|---|---|---|
| supastarter | €349 / €799 / €1,499 | Vercel AI SDK chat, streaming | "Serious founders" positioning, brand |
| Makerkit | $299 / $599 | Dev-side only (MCP, AI agent rules) | Three parallel stacks, mature ecosystem |
| ShipFast | $199 / $249 / $299 | Zero native LLM | Distribution (Marc Lou 135k Twitter) |
| TurboStarter | $249 / $399 | "AI Kit": providers, tool calling, memory | Multi-app (web + mobile) |
| SaasRock | $249 / $499 / $1,999 | Prompt Flow Builder (OpenAI-only) | RBAC depth (6 roles, 30 perms, impersonation, GDPR) |
| Nexty (nextforge) | $188 | Multi-modal demos (chat / t2i / i2i / video) | Price, multi-modal showcase |

**Non-findings:** mrrobot (no paid product in band), supafast.co (unreliable, no verified claims).

**Pricing norms:** median $249-499, lifetime license universal, 3-tier structure, free lifetime updates table stakes, no recurring.

**Distribution:** own landing + Stripe checkout universal. ShipFast is the distribution outlier (one-person brand moat, not replicable).

**The original wedge (now superseded):** end-user AI depth. *This is no longer the wedge* — see research pass 2 below.

> Full report: [[project-market-research-2026-06]] in agent memory.

## Research pass 2: buyer voice (2026-06-16)

**Question:** Validate or refute the **"completeness + DX"** wedge for DeesseJS. Mine direct buyer voice across Reddit (r/nextjs, r/SaaS, r/webdev, r/startups, r/Entrepreneur), X, Hacker News, and Product Hunt. Three lenses: wedge validation, unmet needs, landing page language.

**Method:** Deep-research workflow, 103 agents, 21 sources, 52 claims extracted, 25 verified, **8 confirmed / 17 killed** by adversarial vote.

**Headline:** The "completeness + DX" wedge is **directionally supported but the strongest copy-ready buyer voice is thin**. Most surviving evidence is maker self-admission (SaasRock) and n=1 Product Hunt comments. **Refinements are warranted, not a wholesale validation.**

### The 8 surviving claims

1. **Wedge axis #1 (Completeness) is validated by SaasRock's maker admitting "no coding or architecture standards" and "No security tests!"** (HIGH confidence, primary source) — direct confirmation that the completeness gap is real
2. **Wedge axis #2 (DX) is validated by Aneel Panyam (SaasRock PH reviewer)** asking about linting / SAST / DAST / PT / AWS+Cognito — n=1 evidence of stack-opinion demand
3. **Stain Lu on Nexty Product Hunt explicitly articulates the bloat-vs-missing tradeoff:** *"tried shipfast, tried supastarter, even gave boilerplate.io a shot but they all felt either too bloated or missing key features"* + *"most templates i've tried force you into their specific structure and then you spend days undoing their decisions"*. WEI corroborates. **This is the strongest direct buyer voice we have — gold for landing page copy.**
4. **supastarter directly competes on the "completeness" axis** — they self-position as *"the most complete Next.js SaaS boilerplate and starter kit"* and ship config-driven multi-tenancy toggles. **The wedge is contested, not uncontested.**
5. **Nexty has zero mentions of "orgs / teams / RBAC / multi-tenant" in marketing copy** — exploitable gap
6. **Buyer-voice strength is thinner than hypothesized** — 17 claims refuted in adversarial vote. Surviving evidence is dominated by maker admissions and 1-2 product hunter commenters
7. **The "modular / delete what you don't need" half is best supported as architectural inference, not direct buyer-voice** — supastarter's config flags + Stain Lu's "force you into their structure" quote. No buyer uses "modular" / "delete" language directly
8. **AI primitives as headline is NOT supported by evidence** — no surviving claim positions AI primitives as a primary buying signal. The "completeness + DX" framing is the correct headline; AI primitives stay sub-headline

### Refuted (sample of 12+ killed claims)

- Testimonials validating "completeness + DX" axes (0-3)
- "Weeks of work saved" quantitative language (0-3)
- Buyers explicitly citing SSO as unmet need (0-3)
- "Comprehensive" praise (0-3)
- Free templates perceived as low-quality (0-3)
- $200-300 as price barrier (0-3)
- Buyers using "modular" or "delete" terminology (0-3)
- Multi-tenancy / auth as "necessity" with "huge starting advantage" (0-3)
- SaasRock "2 years of work from a great engineer" praise (0-3)
- ShipFast reviews praising "rapid setup" as dominant buying signal (0-3)
- Lean templates force painful retrofitting (0-3)
- 21-year-old indie dev building $49 alternative (1-2)

### Implications for the spec

1. **Refine the positioning.** "Complete + DX" alone isn't enough — supastarter is competing on completeness. Sharper differentiator: *"the only complete one that doesn't force an architecture on you"* or *"complete out of the box, modular by design, delete what you don't need."*
2. **Use Stain Lu's quote in landing-page copy** (hero or sub-headline). It's the most citable direct buyer pain we have.
3. **Make "modular" a real, citable architectural commitment** — not a tagline. Document it, show it in the file structure, prove it in a demo. No one else is making this claim with proof.
4. **AI primitives stay sub-headline** — the data confirms the user's earlier call.
5. **The wedge is inferred, not confirmed.** The next public artifact (a feature done to 100% on the new modular stack) is the proof that converts the inference into evidence.
6. **More buyer-voice research might be warranted** — but only on specific questions, not a third broad pass.

### Open follow-up questions

- Are there specific Reddit threads in r/nextjs / r/SaaS / r/webdev (last 6-12 months) with "completeness" / "modular" / "delete what you don't need" language? Standard pass didn't surface them; a deeper targeted search might.
- Is supastarter's "most complete" positioning stable over time, or a marketing cycle? If they own that phrase in Google's index, DeesseJS needs a sharper claim.
- What's the actual rate of post-purchase regret for "complete but rigid" vs "lean but flexible" templates? Without that number, the wedge is qualitative.

> Full report: [[project-buyer-voice-2026-06]] in agent memory.

## How to use this document

- When writing the landing page, **use the Stain Lu quote** in the hero or sub-headline.
- When writing competitor comparisons, **lead with the modular differentiator from supastarter** — the bloat-vs-missing tradeoff is the only buyer-validated gap we found.
- When justifying the deferred AI features (vector DB, observability, evals), **cite claim 8** (AI primitives as headline is NOT supported by evidence).
- When someone asks "is the wedge real?", **point to claim 6** (buyer-voice strength is thinner than hypothesized) — be honest about the inferred vs confirmed distinction.

## Cross-references

- README: [`README.md`](./README.md) — high-level product brief
- Architecture: [`architecture.md`](./architecture.md) — stack reference
- Positioning: [`positioning.md`](./positioning.md) — brand + wedge + copy
- Pricing: [`pricing.md`](./pricing.md) — pricing strategy
- Memory: [[project-market-research-2026-06]] (pass 1), [[project-buyer-voice-2026-06]] (pass 2)
