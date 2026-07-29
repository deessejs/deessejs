# DeesseJS — Features Spec

> **The single source of truth for "what does DeesseJS ship."** Synthesizes the competitive landscape, buyer-voice research, and our product principles into one inventory. Every feature has a **status** (ship / partial / defer / skip / buyer), a **source** (competitive / user / differentiator), and a one-line rationale. Deep-dives live in the linked docs; this is the inventory.

## How to read this

**Status legend:**
- ✅ **SHIP** — fully implemented in v1
- 🟡 **PARTIAL** — implemented with documented limitations
- 🔵 **DEFER** — architecture reserved, no implementation in v1 (post-launch candidate)
- ⚪ **SKIP** — explicitly out of scope for v1 (rationale required)
- 🟣 **BUYER** — buyer implements themselves, we ship the docs / scaffold / pattern

**Source legend:**
- **C** = competitive baseline — without this, we lose the comparison
- **U** = user research — buyers explicitly ask for this
- **D** = differentiator — no competitor has it; this is our shot

**The "done" definition.** Every ✅ or 🟡 feature passes 10 dimensions before we call it shipped:
1. Happy path covered + 2 unhappy paths
2. Documentation in Fumadocs
3. Full TypeScript types end-to-end
4. i18n readiness (even if only `en` ships)
5. Accessibility (WCAG 2.1 AA)
6. Responsive (mobile + tablet + desktop)
7. **Modular** — the delete test passes (feature can be removed without breaking the rest)
8. Performance (Lighthouse ≥ 90, server response < 200ms p95)
9. Security (OWASP top 10 reviewed)
10. Observability (the feature is instrumented; events visible to the buyer)

**No half-built features.** A feature is either in at 100% or it doesn't ship. "Apple" positioning breaks on the first half-baked screen.

**Cross-references:** deep rationale lives in [`../README.md`](../README.md), [`../architecture.md`](../architecture.md), [`../positioning.md`](../positioning.md), [`../pricing.md`](../pricing.md), [`../onboarding.md`](../onboarding.md), [`../build-roadmap.md`](../build-roadmap.md), [`../competitive-teardowns.md`](../competitive-teardowns.md), [`../research.md`](../research.md).

## Index of feature categories

| # | Surface | File | Features |
|---|---|---|---|
| 1 | Auth & identity | [01-auth-and-identity.md](./01-auth-and-identity.md) | 24 |
| 2 | Orgs & RBAC | [02-orgs-and-rbac.md](./02-orgs-and-rbac.md) | 24 |
| 3 | Billing | [03-billing.md](./03-billing.md) | 20 |
| 4 | Background jobs | [04-background-jobs.md](./04-background-jobs.md) | 13 |
| 5 | Mail | [05-mail.md](./05-mail.md) | 13 |
| 6 | Storage | [06-storage.md](./06-storage.md) | 11 |
| 7 | API (internal + public) | [07-api.md](./07-api.md) | 15 |
| 8 | SDK | [08-sdk.md](./08-sdk.md) | 10 |
| 9 | CLI | [09-cli.md](./09-cli.md) | 15 |
| 10 | UI / design system | [10-ui.md](./10-ui.md) | 22 |
| 11 | In-app notifications | [11-in-app-notifications.md](./11-in-app-notifications.md) | 14 |
| 12 | i18n | [12-i18n.md](./12-i18n.md) | 10 |
| 13 | Onboarding | [13-onboarding.md](./13-onboarding.md) | 9 |
| 14 | Documentation | [14-documentation.md](./14-documentation.md) | 14 |
| 15 | Blog | [15-blog.md](./15-blog.md) | 12 |
| 16 | Marketing & sales | [16-marketing-and-sales.md](./16-marketing-and-sales.md) | 10 |
| 17 | AI primitives | [17-ai-primitives.md](./17-ai-primitives.md) | 28 |
| 18 | Security & compliance | [18-security-and-compliance.md](./18-security-and-compliance.md) | 20 |
| 19 | Performance & DX | [19-performance-and-dx.md](./19-performance-and-dx.md) | 26 |
| 20 | Cross-cutting | [20-cross-cutting.md](./20-cross-cutting.md) | 16 |
| 21 | Admin dashboard | [21-admin-dashboard.md](./21-admin-dashboard.md) | 20 |
| 22 | SEO | [22-seo.md](./22-seo.md) | 28 |
| 23 | Testing | [23-testing.md](./23-testing.md) | 32 |
| | **Total** | | **~400 features** |

## Feature gap analysis — what we ship that no competitor has

The features marked with source **D** in the per-category files. The 12 most-cited:

1. **Real, tested modularity** (20.1, 20.2, 23.25) — every feature deletable, verified by delete tests in CI
2. **User-facing CLI as a product feature** (9.1) — gh/vercel-style, ships with the buyer's product
3. **Per-tenant theming** (10.5) — buyer's customers can rebrand
4. **Per-tenant LLM cost tracking + budgets** (17.15, 17.16) — meter every LLM call, enforce hard caps
5. **Auto-generated TS SDK per buyer** (8.2) — buyers get their own npm package
6. **API analytics in-product + admin dashboard** (7.13, 21.7) — per-org calls / errors / p95, surfaced in the admin UI
7. **Email digest for in-app notifications** (11.8) — opt-in, per-user
8. **Multi-channel notifications** (11.14) — in-app + email + (v2) push, per-user preference
9. **Architecture standards documentation** (14.7) — the doc most templates don't ship
10. **API reference auto-generated from OpenAPI** (14.6) — buyers never write API docs
11. **Human-in-the-loop agent checkpoints** (17.14) — pause, approve, resume
12. **Onboarding email sequence** (13.6) — sells the buyer's product to their users
13. **Flaky test detection in CI** (23.23) — flag tests that flake > 2% of runs
14. **Multi-tenant test scenarios** (23.30) — per-org isolation and per-plan limits tested
15. **Lighthouse SEO audit + Core Web Vitals in CI** (22.16, 22.25) — SEO discipline is CI-enforced
16. **DevTools bubble** (10.23) — persistent floating panel: org/user, feature flags, LLM token usage, API requests, DB queries, cache hit/miss, env/version. **No competitor ships this.**
17. **Built-in feature flag SDK** (20.14) — `useFeatureFlag` + `server.flags.get`, UI toggle in admin (21.13), per-org and global overrides, real-time via Upstash Realtime. Buyer does not wire PostHog / GrowthBook.

**The pattern:** every differentiator is something the buyer would otherwise build themselves. "Modular" is the most-quoted unmet need (Stain Lu quote is gold). CLI, SDK, per-tenant theming, per-tenant AI cost tracking are all "would cost the buyer 2-4 weeks to build correctly" features.

## Feature deletions — what we explicitly don't ship (and why)

These are decisions, not oversights. The reasoning is "what doesn't ship is as important as what does."

| Skipped | Why |
|---|---|
| **Multi-tenant template** | The template is single-tenant. Multi-tenant is what the buyer builds on top. Pre-baking it would force a specific architecture on every buyer. |
| **Mobile native apps** | No team has shipped all of: web + mobile + docs + blog + CLI + SDK to 100%. Mobile is v2. |
| **RAG / vector DB in v1** | Architecture reserved. Adding it would lock a provider (Pinecone vs pgvector vs Turbopuffer) before buyers tell us which they want. |
| **Observability in v1** | Langfuse, Helicone, LangSmith are mature; buyers will pick. We document the integration. |
| **Evals in v1** | Cascade with observability. Paired in v2. |
| **Multi-locale in v1** | en only. Architecture translatable. Adding locales before we know which is premature. |
| **Free / OSS tier** | None of the direct competitors have one. Adding it splits the team's attention. Post-launch candidate. |
| **Hosted / no-code variant** | Out of scope. The product is a git repo. |
| **SAML SSO** | Enterprise-only. Buyer adds via Better Auth plugins. |
| **Sub-orgs / teams within orgs** | v1 doesn't ship. Most buyers don't need. |
| **Resource-level permissions** | Org-level only in v1. Per-resource is a v2 pattern buyers can layer. |
| **Voice / video as primary modality** | Out of scope. Multi-modal input is in. |
| **SOC2 / HIPAA certification** | Out of scope. Architecture supports. Certification is the buyer's journey. |
| **SOC2 / HIPAA penetration testing** | Out of scope. |
| **Penetration testing** | Out of scope. |
| **Bug bounty** | Out of scope. |
| **A/B testing** | v2. |
| ~~**Buyer-facing feature flags**~~ | → ✅ shipped in v1 (20.14). |
| **Antivirus on uploads** | Buyer wires their own (Cloudflare AV). |
| **Python / Go SDKs** | v2. TypeScript is the audience. |
| **Web push notifications** | v2. iOS support is murky. |
| **Multi-org branding (per-tenant, full)** | 2.10 ships logo + color + font. Full custom domain + DNS theming is a v2. |
| **Multi-currency (EUR / GBP)** | Default to USD-only in v1. Add at launch if asked. |
| **Lemon Squeezy / Polar wrappers** | Direct Stripe. Buyers can swap if they want. |
| **Revenue reporting dashboard** | Buyer uses Stripe Sigma or builds their own. |
| **Backup / disaster recovery** | Buyer's cloud config. We document, don't pre-build. |
| **Status page (built-in)** | Buyer uses Better Uptime, Instatus, etc. |
| **On-call rotation** | Buyer's team config. |
| **Incident management** | Buyer's tooling. |
| **Fine-tuning (model training)** | Out of scope. Buyer uses OpenAI / Anthropic dashboards. |
| **Self-hosted AI (Ollama) for production** | Dev / test only. Production is the provider's API. |
| **Mobile responsive for the docs site** | Web is responsive. The docs site is desktop-first (developers read docs on laptops). |

## Feature status by milestone

| Surface | M0 | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 |
|---|---|---|---|---|---|---|---|---|---|
| Auth & identity | scaffold | ✅ all | — | — | — | — | — | — | QA |
| Orgs & RBAC | scaffold | 2.1-2.9 | 2.13-2.24 | — | — | — | — | — | QA |
| Billing | — | — | — | ✅ all | — | — | — | — | QA |
| Background jobs | scaffold | — | — | — | ✅ all | — | — | — | QA |
| Mail | scaffold | — | — | — | ✅ all | — | — | — | QA |
| Storage | scaffold | — | — | — | ✅ all | — | — | — | QA |
| API | scaffold | — | — | — | — | ✅ all | — | — | QA |
| SDK | — | — | — | — | — | ✅ all | — | — | QA |
| CLI | — | — | — | — | — | ✅ all | — | — | QA |
| UI | scaffold | — | — | — | ✅ all | — | — | — | QA |
| In-app notifications | — | — | — | — | ✅ all | — | — | — | QA |
| i18n | scaffold | — | — | — | ✅ 12.1, 12.2, 12.6, 12.7 | — | — | — | QA |
| Onboarding | — | — | — | — | ✅ all | — | — | — | QA |
| Documentation | scaffold | — | — | — | ✅ all | — | — | — | QA |
| Blog | — | — | — | — | ✅ all | — | — | — | QA |
| Marketing & sales | — | — | — | — | — | — | — | ✅ all | QA |
| AI primitives | — | — | — | — | — | — | ✅ 17.1-17.19 | — | QA |
| Security | scaffold | — | — | — | — | — | — | — | ✅ all + QA |
| Performance & DX | scaffold | — | — | — | — | — | — | — | ✅ all + QA |
| Cross-cutting | scaffold | — | — | — | — | — | — | — | ✅ all + QA |
| Admin dashboard | — | — | — | — | scaffold | ✅ all | — | — | QA |
| SEO | — | — | — | — | ✅ core (22.1-22.8) | — | — | ✅ marketing (16.8) | QA |
| Testing | scaffold | ✅ per feature | ✅ per feature | ✅ per feature | ✅ per feature | ✅ per feature | ✅ per feature | ✅ per feature | ✅ all + QA |

M8 is the QA pass — every feature gets the "done" check, every delete test runs, every doc is reviewed.

## Open feature questions

The features and feature-decisions still pending:

- **M0:** monorepo structure (pnpm + Turborepo confirmed as default, but not locked) — see [`../open-questions.md`](../open-questions.md) P1
- **M3:** Stripe vs Lemon Squeezy / Polar wrapper — P1
- **M5:** CLI language (Bun vs Node vs Go vs Rust) — P1
- **M7:** multi-currency at launch (USD only in v1; EUR if asked) — P2
- **M7:** education / non-profit discount — P2
- **M4:** demo data on first run (recommended yes) — P3
- **M4:** one-click Vercel deploy (recommended docs-only) — P3
- **M7:** public demo app (recommended yes) — P3
- **v2:** more languages (en + fr + de + es + ...), RAG, observability, evals, mobile, voice — deferred by design

## How to use this doc

- **Before adding a feature to a milestone:** add it to the relevant category file with status + source + rationale. If you can't write the rationale, the feature isn't ready to add.
- **Before cutting a feature:** move it to "Feature deletions" in this README with the reason. The deletion is a decision.
- **When a feature ships:** update the milestone table in this README. M8 QA validates every ✅ cell.
- **When the buyer voice changes:** re-rate the source. What was a D (differentiator) last quarter might be a C (competitive baseline) this quarter.
- **When a competitor ships something we don't:** write a note in [`../competitive-teardowns.md`](../competitive-teardowns.md) and decide: respond, defer, or skip.
