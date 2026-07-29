# DeesseJS — Unmet Needs Analysis (2026-06-16)

> **Source:** Deep-research workflow, 4 phases, 9 agents, ~21 min wall time. Sweep across Reddit, Product Hunt, GitHub issues, Twitter/X, Indie Hackers, Hacker News, and a competitor-gap analysis. Read the full transcript at `C:\Users\dpereira\.claude\projects\...\tasks\w43gri629.output` for the raw sweep data.
>
> **The thesis the report validates:** the wedge ("Apple of SaaS templates" = completeness + DX) is real. Most unmet needs in the market fall into two buckets — (1) shallow implementations of features every template claims to have (billing, admin, testing, security), and (2) the modular contract with proof. Both are already in the DeesseJS spec. The report tells us which features must ship at 100%, which sub-features are differentiators worth marketing, and which competitor bait we should not take.

## Top 10 Unmet Needs to Address

**1. Real subscription/billing UX (not just a Stripe checkout)**
- *Why it matters:* Reviewers literally call Stripe an afterthought in ShipFast and supastarter; 17 mentions across PH/GH/HN make this the loudest B2B blocker.
- *Effort + strategic value:* L effort, highest wedge leverage — billing is the single most-bashed surface in the band.
- *Recommendation:* Ship end-to-end checkout, portal, subs, per-seat, proration, dunning, webhooks; add the explicit "protect pages by subscription tier" doc and demo it in the public demo app. (Sources: https://www.producthunt.com/products/shipfast, https://www.producthunt.com/posts/nexty)

**2. Auth depth and IdP coverage (SSO/OAuth)**
- *Why it matters:* SSO/OAuth coverage is the #1 retrofitting tax B2B buyers cite; 9+ PH/GH threads call out missing IdP support.
- *Effort + strategic value:* M effort, reinforces the wedge — most is already shipped.
- *Recommendation:* Ship email+pw, OAuth Google/GitHub/MS/Apple, 2FA, passkeys, MFA, sessions, audit, account merge; add the explicit middleware route-protection example and document SAML as a buyer-implementable Better Auth plugin. (Sources: https://www.producthunt.com/posts/saasrock, https://github.com/nextjs/saas-starter/issues/60)

**3. Multi-tenant orgs, RBAC, and tenant isolation**
- *Why it matters:* Single-user templates disqualify DeesseJS for any B2B deal; "Multi-tenant architecture with 3-tier RBAC" is the single most-requested class in the $299-999 band.
- *Effort + strategic value:* L effort, reinforces the wedge — 2.1-2.10 already ship.
- *Recommendation:* Ship multi-org, custom roles, ~30 perms, impersonation, IP controls, GDPR; surface in marketing copy and document the sub-orgs gap (2.11 skip) as a buyer-pattern v2. (Sources: https://www.producthunt.com/products/saasrock, https://hn.algolia.com/api/v1/search?query=stripe+auth+admin+boilerplate)

**4. Per-tenant LLM cost / quota / hard-cap enforcement**
- *Why it matters:* Multi-tenant AI apps without hard caps lose money on a single runaway tenant; this is a structural differentiator no competitor ships.
- *Effort + strategic value:* M effort, reinforces the wedge — 17.15, 17.16, 17.17 ship end-to-end.
- *Recommendation:* Keep per-tenant metering tight; surface the cost dashboard in admin (21.x) and pair it with usage-based Stripe billing (3.5, 3.19). (Sources: https://supastarter.dev/docs, https://nexty.dev/, https://turbostarter.dev/docs)

**5. Modular contract with CI-verified delete tests**
- *Why it matters:* "Most templates force you into their specific structure and then you spend days undoing their decisions" is the single most-cited unmet need in buyer-voice research (Stain Lu).
- *Effort + strategic value:* M effort, the flagship wedge proof — 20.1 and 20.2 already ship.
- *Recommendation:* Keep the "Deleting features" flagship doc (13.9, 14.8) front and center; ensure every feature folder has its delete test and surface "195 integration tests" in marketing. (Sources: https://www.producthunt.com/posts/nexty, https://www.producthunt.com/products/nexty)

**6. Unopinionated escape hatch from the template**
- *Why it matters:* Forced opinions cause buyers to spend days ripping out code; this is the #1 churn reason between starters.
- *Effort + strategic value:* M effort, reinforces the wedge — modular contract (20.1) and delete tests (20.2) are the proof.
- *Recommendation:* Ship the modular contract and delete-test discipline; make the "Deleting features" doc the first thing buyers see in onboarding. (Sources: https://www.producthunt.com/posts/nexty)

**7. Enterprise security/compliance and procurement-ready guardrails**
- *Why it matters:* Procurement failure is binary; SaasRock's own maker admits "No security tests" and no coding/architecture standards — a hard fail for any B2B review.
- *Effort + strategic value:* M effort, reinforces the wedge — 18.x and 2.24 mostly ship.
- *Recommendation:* Ship SAST/DAST tooling, an explicit SECURITY.md, IP controls (2.21, 2.22), GDPR (2.24), XSS sanitization (18.2), and document the SOC2/HIPAA "architecture supports, not certified" position. (Sources: https://www.producthunt.com/posts/saasrock, https://hn.algolia.com/api/v1/search?query=Next.js+boilerplate+missing)

**8. Background jobs / cron / rate limiting in the box**
- *Why it matters:* Re-implementing rate limiting + cron + retries is the unspoken re-build tax; "the boring but hard parts get re-built badly across projects."
- *Effort + strategic value:* M effort, reinforces the wedge — 4.1-4.13 ship.
- *Recommendation:* Ship Trigger.dev v3, cron, retries, DLQ, per-queue/per-org concurrency (4.7), per-org rate limiting (4.13); demo the job dashboard in the public demo app. (Sources: https://hn.algolia.com/api/v1/search?query=stripe+auth+admin+boilerplate)

**9. Admin dashboard with depth (impersonation, health, feature flags, revenue, API analytics)**
- *Why it matters:* Stripped admin dashboards are the #1 "marketing vs reality" trust failure; users paid for ixartz PRO plan and couldn't find the admin panel.
- *Effort + strategic value:* L effort, reinforces the wedge — 21.1-21.20 ship.
- *Recommendation:* Demo the system admin (21.7 API analytics, 21.13 feature flags, 21.17-21.18 impersonation) in the public demo app (16.10) so the "PRO plan mismatch" trust failure is solved publicly. (Sources: https://github.com/ixartz/SaaS-Boilerplate/issues/92, https://hn.algolia.com/api/v1/search?query=stripe+auth+admin+boilerplate)

**10. Testing/quality discipline (E2E, CI, multi-tenant, flaky detection)**
- *Why it matters:* "Untested boilerplate trap" is the single most damaging long-term reputation hit; 7 GH/HN threads cite missing Playwright/Integration tests.
- *Effort + strategic value:* L effort, reinforces the wedge — 23.1-23.32 ship.
- *Recommendation:* Surface the CI matrix badge and the "195 integration tests" claim in marketing; keep 23.23 flaky detection and 23.30 multi-tenant scenarios visible as the explicit differentiators. (Sources: https://hn.algolia.com/api/v1/search?query=Next.js+boilerplate+missing, https://github.com/boxyhq/saas-starter-kit/issues/511)

## Notable P2/P3 Ideas (Optional Backlog)

- **Per-tenant LLM token metering + Stripe usage-based billing (3.5, 17.15-17.17, 3.19)** — ship when buyer asks; not for v1.
- **B2B modules the template maker keeps promising for v2** (help-desk, affiliates) — partner-integrate (Intercom, Rewardful) instead of building.
- **RAG / vector DB / page-level citations (17.20-17.23)** — architecture reserved; re-evaluate post-launch.
- **AI observability & tracing (17.24)** — buyer-wired; ship a Langfuse recipe in docs.
- **Multi-modal AI demos polish (17.28 partial)** — make the existing demos tangible in the public demo app (16.10).
- **Self-hostable Docker / Dokploy / Coolify guide + AWS SST tutorial** — adds to the deploy path; partial effort.
- **Human-in-the-loop reusable across jobs (4.x) and public API (7.x)** — currently scoped to AI; broaden the primitive.
- **Marketing email / newsletter / waitlist + affiliate capture (5.6, 15.8, 16.6)** — ship a Rewardful integration recipe.
- **Plug-and-play analytics providers swap (16.7)** — single-switch config for Plausible / PostHog / Umami / Vemetric / Rybbit.
- **AI-native structure (CLAUDE.md, AGENTS.md, .cursorrules, dev-mode MCP server)** — cheap, opens the agent-native axis.
- **Onboarding & repo delivery friction (Day-0)** — ensure .gitignore excludes .next/ so `git push` always works.
- **AI-search-specific SEO checklist (FAQ schema, SoftwareApplication, llms.txt)** — audit the demo app publicly.

## Surprises / Non-Obvious Findings

1. **The "after launch" gap is the real buyer pain** — supastarter's own founder publicly markets against it: "Most SaaS boilerplates help you launch fast. But what happens after you launch?" (https://x.com/jonathan_wilke/status/2031013767799050398). This is narrative leverage DeesseJS should claim explicitly.
2. **ShipFast literally cannot be pushed to GitHub out of the box** — buyers spent ~2 hours using a Custom GPT to get around "file exceeds GitHub's size limit" (https://x.com/CSMikeCardona/status/1727081167818797223). A clean repo that pushes on first try is a wedge.
3. **AI-search / schema markup is becoming a public trust failure** — ShipFast audited at 50/100 because "schema markup is tanking the score" (https://x.com/imis4n/status/2044897472414351485), and AI is already sending 200 visitors/month to ShipFast (https://x.com/marclou/status/1969018901792194681). A CI-enforced Lighthouse SEO audit is becoming table-stakes, not premium.
4. **The "untested boilerplate" trap is a buyer-named category** — buyers explicitly call it out: "I specifically wanted to avoid the 'untested boilerplate' trap by writing 195 backend integration tests" (https://hn.algolia.com/api/v1/search?query=Next.js+boilerplate+missing). 195 is a number buyers remember; use it.
5. **The "PRO plan mismatch" trust failure is a real revenue leak** — ixartz/SaaS-Boilerplate GitHub issue #92 has users paid for the PRO plan and unable to find the admin panel. A live public demo app (16.10) that actually exposes the system admin closes this trust gap for DeesseJS.

## What NOT to Ship

1. **Multi-payment provider abstraction (Lemon Squeezy / Polar / Creem / Dodo wrappers)** — supastarter ships 5 providers and TurboStarter ships 4, but the abstraction cost is real for a small segment and the wedge is "depth on Stripe." Stay direct-Stripe (3.20 SKIP), document the swap pattern, and revisit post-launch. (Source: https://supastarter.dev/, https://turbostarter.dev/)
2. **Schema-driven Entity Builder / custom entities with auto-CRUD (SaasRock's wedge)** — risks making the template feel magical-but-brittle, which breaks the Apple positioning; Drizzle migrations (20.6) + delete tests (20.2) give buyers a stronger pattern. (Source: https://saasrock.com/changelog)
3. **Workflow automation builder (no-code triggers/actions, SaasRock's differentiator)** — opens a Zapier-style vertical axis that breaks the horizontal wedge; buyers can wire Trigger.dev jobs (4.x) as their workflow engine. (Source: https://saasrock.com/changelog)
4. **Mobile native apps (React Native / Expo)** — README explicitly defers; no team has shipped all of web + mobile + docs + blog + CLI + SDK to 100%. Only TurboStarter ships mobile and the wedge is web-first. (Source: https://turbostarter.dev/)
5. **Free / open-source tier** — README explicitly scopes this as a v2 candidate; the $299-999 paid-only stance is supported by supastarter, ShipFast, SaasRock, TurboStarter all skipping it. Adding it splits the team's attention. (Source: https://nexty.dev/, https://makerkit.dev/)
6. **Multi-tenant no-code CMS with paywall + AI translation (Nexty's wedge)** — niche; buyers building content sites pick a dedicated CMS, and the buyer's own content is covered by blog (15.x) and docs (14.x). (Source: https://nexty.dev/)
7. **Browser extension (Chrome/Firefox/Edge)** — niche; only TurboStarter ships one; not on the wedge. v2 candidate at most. (Source: https://turbostarter.dev/)
8. **Embeddable widgets (SaasRock's Enterprise-only surface)** — enterprise-only; not in the v1 band; document as a buyer extension. (Source: https://saasrock.com/changelog)

## Recommended Next Steps

1. **Add a SECURITY.md to the repo and a public cadence badge + monthly changelog feed + "last release" widget on the landing page (16.1)** — solves the "is it abandoned?" trust failure in <XS effort; ties directly to the "after you launch" narrative.
2. **Demo the system admin (21.x), per-tenant LLM cost dashboard (17.15-17.17), billing portal, CLI (9.1), and SDK playground (7.14) in the public demo app (16.10)** — closes the "PRO plan mismatch" trust failure and gives buyers a tangible proof point for the wedge.
3. **Publish a public roadmap + public changelog + SECURITY.md while the repo stays private** — the trust signals don't have to be gated by repo visibility; this is positioning, not engineering.
4. **Document the SAML/SSO-as-Better-Auth-plugin and per-tenant-extension patterns (Drizzle User model, audit log, SSO reading extended shape) in docs** — converts a perceived gap into a documented buyer pattern; cheap, high signal.
5. **Defer the entire P2/P3 backlog (RAG, multi-payment wrappers, mobile, Entity Builder, no-code CMS, browser extension, embeddable widgets) to [`v2-features.md`](./v2-features.md) with a one-line rationale each** — protects the team from scope creep and makes the "what we don't ship" story explicit on the comparison page (16.3). ✅ Done — see `v2-features.md`.

## Cross-validation against the DeesseJS spec

Every item in the **Top 10** maps to features already in the spec:

| Top 10 | DeesseJS spec coverage |
|---|---|
| 1. Real billing UX | `features/03-billing.md` (3.1-3.20) — ship as planned |
| 2. Auth + IdP | `features/01-auth-and-identity.md` (1.1-1.24) — ship as planned |
| 3. Orgs + RBAC | `features/02-orgs-and-rbac.md` (2.1-2.24) — ship as planned |
| 4. Per-tenant LLM cost | `features/17-ai-primitives.md` (17.15-17.17) + `features/03-billing.md` (3.5, 3.19) |
| 5. Modular + delete tests | `features/20-cross-cutting.md` (20.1, 20.2) + `features/23-testing.md` (23.25) |
| 6. Unopinionated escape | Same as 5 — modular contract is the proof |
| 7. Security + compliance | `features/18-security-and-compliance.md` (18.1-18.20) |
| 8. Background jobs | `features/04-background-jobs.md` (4.1-4.13) |
| 9. Admin dashboard depth | `features/21-admin-dashboard.md` (21.1-21.20) |
| 10. Testing discipline | `features/23-testing.md` (23.1-23.32) |

**Conclusion:** the spec is aligned with the market. The work is execution, not re-design. The non-obvious findings (ShipFast can't be pushed, "195 integration tests" is a buyer-named category, AI-search SEO is a trust failure) are positioning ammunition, not new features.

## Cross-references

- [`features/`](./features/) — the complete features inventory (23 surfaces, ~400 features)
- [`competitive-teardowns.md`](./competitive-teardowns.md) — per-competitor deep-dive
- [`research.md`](./research.md) — earlier market + buyer-voice research
- [`build-roadmap.md`](./build-roadmap.md) — v1 build sequence
- [`open-questions.md`](./open-questions.md) — open questions
