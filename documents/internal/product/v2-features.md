# DeesseJS — v2 Features Backlog

> **The features we explicitly deferred from v1.** Each has a one-line rationale. The defensive list — protects the team from scope creep, informs v2 prioritization post-launch, and gives the comparison page (16.3) its "what we don't ship" content.
>
> **This doc is the source of truth for "what's not in v1."** Items move here from `features/README.md` (deletions), `unmet-needs-2026-06.md` (What NOT to ship), and ad-hoc scope-cut decisions.

## Defer rules (the criteria)

A feature is deferred when **one or more** apply:
1. **Architecture reserved in v1, no provider wired in** — e.g. RAG, vector DB, multi-locale
2. **Buyer will pick their own provider** — e.g. observability, evals, antivirus
3. **Out of band** — e.g. mobile, voice, browser extension, on-prem
4. **Magnitude disproportionate to v1 value** — e.g. free tier, full multi-payment abstraction, certification
5. **Off-axis with the wedge** — opens a vertical that breaks "Apple = completeness + DX" (e.g. no-code workflow builder, Entity Builder)

## The backlog

### AI (deferred)

| Item | Why deferred |
|---|---|
| **RAG / vector DB** (17.20-17.23) | Architecture reserved; no provider locked. Re-evaluate post-launch. |
| **AI observability & tracing** (17.24) | Buyer-wired (Langfuse, Helicone, LangSmith). Ship a recipe in docs. |
| **Evals** (17.25) | Cascade with observability. Paired in v2. |
| **Fine-tuning** (17.26) | Out of scope. Buyer uses OpenAI / Anthropic dashboards. |
| **Voice agents (primary modality)** (17.27) | Out of scope. Multi-modal input is in v1. |
| **Self-hosted AI (Ollama) for production** | Dev / test only in v1. Production is the provider's API. |

### i18n (deferred)

| Item | Why deferred |
|---|---|
| **Multi-locale (fr / de / es / ...)** (12.3-12.5, 12.8-12.10) | en only in v1; architecture translatable. Add locales post-launch based on buyer demand. |
| **Hreflang tags** (22.9) | v2 with i18n. |
| **Translation service integration** (Crowdin, Lokalise) | Buyer wires their own. |

### Mobile / cross-platform (deferred)

| Item | Why deferred |
|---|---|
| **Mobile native apps (React Native / Expo)** | No team ships all of web + mobile + docs + blog + CLI + SDK at 100%. TurboStarter is the only competitor with mobile, and mobile is a half-baked surface for them. |
| **PWA manifest** (22.22) | Related but separate. v2 candidate. |
| **Browser extension (Chrome/Firefox/Edge)** | Niche; only TurboStarter ships one. Not on the wedge. |

### Billing (deferred)

| Item | Why deferred |
|---|---|
| **Multi-payment provider abstraction** (3.20) | Direct Stripe in v1. supastarter ships 5, TurboStarter ships 4, but abstraction cost > value for the wedge. |
| **Lemon Squeezy / Polar / Creem / Dodo wrappers** | Direct Stripe. Document the swap pattern. |
| **Revenue reporting dashboard** (3.18) | Buyer uses Stripe Sigma or builds their own. |
| **Multi-currency (EUR / GBP)** (3.9) | USD-only in v1. Add at launch if buyers ask. |

### SDK (deferred)

| Item | Why deferred |
|---|---|
| **Python / Go SDKs** (8.10) | v2. TypeScript is our audience. |
| **Full per-buyer auto-publish to npm** (8.2 partial) | v1 ships the generation pipeline + a documented "how to publish to your npm" step. Full automation in v2. |

### Notifications (deferred)

| Item | Why deferred |
|---|---|
| **Web push** (11.9) | v2. Service worker + VAPID. iOS support is murky. |
| **Multiple sender domains per org** (5.11) | v1 ships one default sender. |

### Storage (deferred)

| Item | Why deferred |
|---|---|
| **Bucket per org** (6.7) | v1 ships shared bucket with org-prefix. Per-org bucket is a v2 buyer pattern. |
| **Antivirus scanning** (6.9) | Buyer wires Cloudflare AV. |

### Orgs / RBAC (deferred)

| Item | Why deferred |
|---|---|
| **Sub-orgs / teams within orgs** (2.11) | Most buyers don't need. v2 candidate if asked. |
| **Cross-org data sharing** (2.12) | The buyer's domain. We don't pre-bake a pattern. |
| **Time-based access (scheduled role expiry)** (2.23) | Enterprise-only. |
| **Resource-level permissions** (2.18) | Org-level only in v1. Per-resource is a v2 pattern buyers layer. |
| **Service accounts (machine identities)** (1.19) | v2. v1 ships user-bound API keys. |

### Auth (deferred)

| Item | Why deferred |
|---|---|
| **SAML SSO** (1.7) | Enterprise-only. Buyer adds via Better Auth plugins. Documented as buyer-implementable. |

### Architecture / process (deferred)

| Item | Why deferred |
|---|---|
| **Free / OSS tier** | No direct competitor has one. Stay paid-only. v2 candidate. |
| **Multi-tenant no-code CMS + paywall + AI translation** (Nexty's wedge) | Niche. Buyer uses dedicated CMS. |
| **Schema-driven Entity Builder / auto-CRUD** (SaasRock's wedge) | Magical-but-brittle, breaks Apple positioning. Drizzle migrations (20.6) + delete tests (20.2) give buyers a stronger pattern. |
| **Workflow automation builder / no-code** (SaasRock differentiator) | Opens a Zapier-style vertical axis. Trigger.dev jobs (4.x) are the buyer's pattern. |
| **Embeddable widgets** (SaasRock Enterprise surface) | Enterprise-only. Document as buyer extension. |
| **A/B testing** (20.15) | v2. |
| **Buyer-facing feature flags** (20.14) | v2. Buyer can wire PostHog, GrowthBook, etc. |
| **Mutation testing (Stryker)** (23.27) | Slow, high signal but expensive. v2. |
| **AMP** (22.21) | Deprecated by Google. Skip. |
| **Internal linking suggestions** (22.28) | v2. Buyer can wire Yoast-like tools. |

### Compliance / certifications (deferred)

| Item | Why deferred |
|---|---|
| **SOC2 certification** (18.14) | Architecture supports. Certification is the buyer's journey. |
| **HIPAA** (18.15) | Out of scope. |
| **SOC2 / HIPAA penetration testing** (18.16) | Out of scope. |
| **Penetration testing** | Out of scope. |
| **Bug bounty** (18.17) | Out of scope. |
| **On-prem / self-hosted deployment** | Out of scope. Buyer uses Vercel / Cloudflare / Railway. |
| **Self-hostable Docker / Dokploy / Coolify guide + AWS SST tutorial** | Documented in v1; full tutorial is v2. |

### Operations (deferred)

| Item | Why deferred |
|---|---|
| **Backup / disaster recovery** (20.9, 20.10) | Buyer's cloud config. Documented, not pre-built. |
| **Status page (built-in)** (20.11) | Buyer uses Better Uptime, Instatus, etc. |
| **On-call rotation** (20.12) | Buyer's team config. |
| **Incident management** (20.13) | Buyer's tooling (Incident.io, Firehydrant). |

## What this list is good for

1. **Defending "what we don't ship"** — link from the comparison page (16.3) and the "What NOT to ship" section of the landing page. Converts a perceived gap into a documented, reasoned decision.
2. **Informing v2 prioritization** — start here, re-evaluate after launch based on actual buyer demand.
3. **Buyer extension patterns** — many items here have a documented buyer-implementable pattern. Link to the pattern in docs, not in this doc.

## When to add to this list

- When a feature is cut from v1 scope
- When a "ship in v1" decision is reversed
- When research (unmet-needs, buyer-voice, competitive) shows a feature is "off-axis with the wedge"

## When to remove from this list

- When the feature ships in v1 (move it to `features/`)
- When a feature is re-categorized as "out of scope forever" (move it to a separate `out-of-scope.md` if the rationale is "not a template concern")
- When the defer rationale changes (update the row, don't add a new row)

## Recently promoted to v1

| Item | Reason promoted | Date |
|---|---|---|
| **Buyer-facing feature flags** (20.14) | Added to v1 scope after explicit request. Built-in flag SDK (`useFeatureFlag` + `server.flags.get`), admin toggle in 21.13, real-time via Upstash Realtime. Buyer no longer wires PostHog / GrowthBook. | 2026-06-17 |

## Cross-references

- [`features/`](./features/) — the v1 features inventory
- [`unmet-needs-2026-06.md`](./unmet-needs-2026-06.md) — the "What NOT to ship" section that informed this doc
- [`build-roadmap.md`](./build-roadmap.md) — v1 milestones; this doc is the v2 candidate list
- [`README.md`](./README.md) — product brief
