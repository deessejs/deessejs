# C3 — Escape hatch and data portability

> **Source:** C3 subagent in the tech-depth workflow, 2026-06-18.
> **Inputs:** v1 features inventory (`documents/internal/product/features/`), feasibility report (`deessejs-cloud-feasibility-2026-06.md`), vendor docs (Turso CLI, Upstash docs, Resend docs, Stripe Connect docs, Cloudflare DNS API, Vercel Functions/Cron/Blob, Trigger.dev v3 Runs).
> **Scope:** validate the "copy-to-clipboard view of resolved per-service credentials" pattern. Not theater. Define what is in the clipboard, what the buyer receives, what they keep, what they lose, and what is missing.
>
> **VERDICT (one line up front):** the escape hatch is real for data extraction but it is **not** a one-click eject. The buyer can extract every byte of their data, and the platform itself runs on stock OSS that can be re-deployed anywhere — but the *ejection ritual* is a 4-6 hour DevOps session, not a copy-paste, because five Vercel-specific surfaces (Fluid Compute, Vercel Blob, Vercel Cron, Edge runtime, Vercel KV) plus one operator-owned surface (Cloudflare DNS zone, sender domain in operator's Resend) need manual remediation.

---

## 1. Inventory: the 23 v1 surfaces and what data each holds

| # | Surface | Data store(s) | Who owns the data | Portable? | Notes |
|---|---|---|---|---|---|
| 1 | Auth & identity (1.1-1.24) | Turso (users, sessions, MFA, audit), Upstash (active sessions cache, rate-limit counters) | Tenant (per-user) + tiny operator-wide audit | Yes | Sessions are stateless; can be force-revoked. Audit is tenant-scoped except 21.x cross-org. |
| 2 | Orgs & RBAC (2.x) | Turso | Tenant | Yes | Org tree is pure data; FK to users. |
| 3 | Billing (3.x) | Turso (subscriptions, invoices, seats), Stripe (charges, customer, payment methods) | **Split**: tenant's Turso rows; **Stripe lives in the buyer's connected account** (Connect Standard) | Partial | Turso yes; Stripe data already belongs to the buyer's connected account at the moment of creation. See §6. |
| 4 | Background jobs (4.x) | Trigger.dev (job definitions, runs), Upstash (job queues) | Trigger.dev projects live in **operator's Trigger.dev org** (per the feasibility step 5) | Partial | Job *definitions* are in the buyer-owned template repo; *run history* lives in the operator's Trigger.dev org. |
| 5 | Mail (5.x) | Resend (sent messages, suppression list, sender domain), Turso (per-user preferences, templates) | **Resend account is the operator's**; buyer gets a subdomain on `mail.{tenant}.deessejs.com` | Partial | Sender domain ownership transfer required (see §5). Sent-message log is in the operator's Resend; can be exported via Resend's CSV export (admin only). |
| 6 | Storage (6.x) | Cloudflare R2 (objects), Turso (file metadata) | **R2 bucket is operator's**; objects are prefixed `t:{tenantId}/...` | Yes (with work) | R2 has S3-compatible bulk export (`rclone`, `aws s3 sync`); no per-tenant single-button. |
| 7 | API (7.x) | Turso (API keys, rate-limit counters), Hono router | Tenant | Yes | oRPC/Hono are framework code; runs anywhere Node 20+. |
| 8 | SDK (8.x) | n/a (generated) | n/a | n/a | Auto-generated at build time from oRPC; ships with the template repo. |
| 9 | CLI (9.x) | n/a (binary, in template repo) | Buyer (downloads binary) | n/a | Distributed via npm/Homebrew; same binary on Cloud and self-host. |
| 10 | UI (10.x) | Turso (per-org theme tokens, layouts) | Tenant | Yes | Theme is data + components. |
| 11 | In-app notifications (11.x) | Upstash Realtime + Turso (notification table) | Tenant | Yes | Realtime channels are operator-scoped; can be re-subscribed against any Upstash URL. |
| 12 | i18n (12.x) | JSON in repo | Buyer (in repo) | n/a | Lives in git, not in DB. |
| 13 | Onboarding (13.x) | Turso (wizard state) | Tenant | Yes | Wizard state is per-org. |
| 14 | Documentation (14.x) | Fumadocs content in repo | Buyer (in repo) | n/a | Lives in git, not in DB. |
| 15 | Blog (15.x) | Turso (posts), R2 (cover images) | Tenant | Yes | DB rows + R2 prefix export. |
| 16 | Marketing & sales (16.x) | Turso (leads, forms), Resend (outbound) | Tenant | Yes | Lead data is in Turso. |
| 17 | AI primitives (17.x) | Turso (conversation history, per-tenant token meter 17.15), Trigger.dev (long agent jobs) | Tenant | Yes (with caveat) | Conversation history = tenant data. **Provider API keys (OpenAI, Anthropic, etc.) are bought and managed by the buyer** per feasibility risk #4 — these move with the buyer for free, but a new buyer without their own keys breaks the eject path until they wire them. |
| 18 | Security & compliance (18.x) | Turso (audit log, IP allowlist, GDPR tools) | Tenant | Yes | Audit log is append-only Turso rows. |
| 19 | Performance & DX (19.x) | Repo-level config (tsconfig, biome, turbo) | Buyer (in repo) | n/a | In git. |
| 20 | Cross-cutting (20.x) | n/a — telemetry, errors, feature flags | Mixed | Partial | Error tracking is a Sentry project the buyer adds; feature flags are in Turso. |
| 21 | Admin dashboard (21.x) | n/a — surface in app | n/a | **Operator-only** | This is the *operator*'s admin UI, not a tenant's. The tenant has their own RBAC admin (surface 2). On eject, 21.x is gone; the buyer runs their own equivalent if they want one. |
| 22 | SEO (22.x) | Turso (per-org sitemap overrides, redirect map) | Tenant | Yes | Per-org config in Turso. |
| 23 | Testing (23.x) | Repo-level (Vitest, Playwright) | Buyer (in repo) | n/a | In git. |

**Summary:** 18 of 23 surfaces are pure tenant data in Turso + per-tenant Upstash prefix + per-tenant R2 prefix. They move with a SQL dump + REST SCAN + rclone sync. The five surfaces with operator-owned data are: **#3 (Stripe split), #4 (Trigger.dev runs), #5 (Resend domain), #6 (R2 bucket ownership), and #17 (provider keys that the buyer already owns)**. Surface #21 is the only one the operator *keeps* on eject; the buyer is not entitled to it.

---

## 2. Data export matrix (surface × format × cost)

| Surface | Export format | Tool | Time @ typical scale | Who runs it | What does NOT move |
|---|---|---|---|---|---|
| 1. Auth & identity | `dump.sql` (libSQL text) | `turso db export` then `turso db shell < dump.sql` | ~30s for 1M users; **2-5min for 10M users** (drizzle-style users table ~50 cols) | Tenant, one CLI call | Active sessions in Upstash — must be invalidated on the new host (sessions are JWT-ish in Better Auth, but the cache is regenerated on first request). |
| 2. Orgs & RBAC | Same `dump.sql` (FKs to #1) | same | <1 min (small) | Tenant | n/a |
| 3. Billing (Turso half) | Same `dump.sql` | same | <1 min | Tenant | **Stripe data** — already in the buyer's connected account (see §6). |
| 3. Billing (Stripe half) | Stripe API + Dashboard CSV | `stripe.com/{acct_id}/...` or Stripe Sigma | ~5 min | Tenant (already has Dashboard access) | n/a — buyer owns it. |
| 4. Background jobs (definitions) | git clone of template repo | `git clone` | seconds | Tenant (in repo) | n/a |
| 4. Background jobs (runs) | Trigger.dev v3 `runs.list()` JSON | REST API + cursor pagination | ~5-15 min for 100k runs | Tenant (gets a one-time Trigger.dev API token) | **In-flight runs are lost.** Live jobs running at the moment of eject will fail; buyer must design their workloads to be idempotent. |
| 5. Mail (Turso half: prefs, templates) | `dump.sql` | same as #1 | <1 min | Tenant | n/a |
| 5. Mail (Resend half: sent log, suppression) | Resend Dashboard CSV export | `resend.com/.../data-exports` | ~10-30 min for 100k messages | Tenant gets a one-time read-only API key from operator | **Sender domain must be transferred** (see §5) — Resend account itself is operator's. |
| 6. Storage (R2) | S3 sync of `t:{tenantId}/` prefix to buyer's R2/S3 | `rclone sync` or `aws s3 sync --exclude "*" --include "t:abc123/*"` | ~5-30 min for 100 GB on the cheap tier; egress is free on R2 | Tenant | **No metadata-only export** — the buyer gets a prefix. Per-file metadata is duplicated in Turso (6.10) and moves with the Turso dump. |
| 6. Storage (Turso half: file metadata) | `dump.sql` | same as #1 | <1 min | Tenant | n/a |
| 7-9, 10-23 (rest of Turso data) | `dump.sql` | same as #1 | minutes total | Tenant | n/a |
| Stripe (Resend-style) | Stripe Dashboard CSV | n/a | seconds | Tenant | n/a |
| Cloudflare DNS zone | BIND zone file | `GET /zones/{id}/dns_records/export` | seconds (256 KiB cap) | Operator-side | **NS delegation is a manual step at the registrar.** The buyer must re-point nameservers at the new DNS host. |
| Vercel project | n/a (not data) | n/a | n/a | n/a | **The Vercel project is operator-owned on the operator's team account.** The buyer needs a new Vercel project. |
| Trigger.dev project | n/a (not data) | n/a | n/a | n/a | **The Trigger.dev project is operator-owned on the operator's org.** The buyer needs a new Trigger.dev org or a self-hosted Trigger.dev instance. |

### Per-tenant total eject time (p95 estimate, Team-tier 25 GB Turso, 5 GB R2, 100 GB Upstash Realtime cache, 50k jobs run history)

- Turso dump + R2 sync + Upstash SCAN + Trigger.dev run list + Stripe CSV + Resend CSV + Cloudflare BIND export: **30-90 minutes wall clock**, mostly I/O-bound.
- **The bottleneck is the Upstash SCAN for the `t:{tenantId}:*` keyspace** — at 100k keys with 10 KB average value, expect 15-40 min at 100 RPS through the REST API. The daily command limit on a free Upstash DB is 10k; the buyer must burn a paid DB or use a local Redis for staging.
- Domain NS delegation to buyer's DNS is the longest *human-time* step (TTL propagation 5 min - 48 hr depending on the registrar's default TTL).

---

## 3. Self-host runnability: does the template actually run without the operator?

**Yes, with caveats.** The template repo + a single env file is sufficient to boot the app on a vanilla Node 20+ host. The blockers are Vercel-specific features and the operator-owned accounts.

### Required env vars (what is in the "clipboard")

A single `.env` (or 12-factor equivalent) — there is no docker-compose for the buyer to author. The full list:

```bash
# Application
DEESSEJS_SECRET=<JWT signed by operator, exp+365d, payload=resolves all of the below>
# Or — for self-host post-eject — the resolved values directly:
TURSO_URL=libsql://...
TURSO_TOKEN=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
TRIGGER_PROJECT_REF=prj_...
TRIGGER_SECRET_KEY=...
RESEND_API_KEY=re_...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_ACCOUNT_ID=...
CLOUDFLARE_ZONE_ID=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
# Buyer-owned (not provided by operator)
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_GENERATIVE_AI_KEY=...
# Optional
SENTRY_DSN=...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://...
```

That's 25-30 env vars. The operator ships a `bunx deessejs eject` or `deessejs eject` CLI that emits a `tenant-XXXX-eject-2026-06-18.tar.gz` containing:
- a generated `.env` with the values above populated
- a `DATABASE_DUMP.sql` from `turso db export`
- an `r2-manifest.json` listing the per-tenant prefix
- a `trigger-runs.jsonl` (one-line-per-run export)
- a `resend-sent-log.csv` (if buyer has a Resend API key)
- a `bind-zone.txt` (the buyer's DNS zone)
- a `EJECTION.md` doc with the 12-step runbook
- a `docker-compose.yml` for local replay (uses local libSQL, local Redis, MinIO)

### Vercel-specific surfaces and what to do with them on eject

| Vercel feature | Used by DeesseJS? | What breaks on self-host? | Mitigation |
|---|---|---|---|
| **Fluid Compute** | Yes (default per Vercel docs as of 2025-04-23, and the feasibility assumes it for active-CPU billing) | None at the app level — Fluid is a *runtime optimization*, not an API surface. The app code does not call Fluid. A buyer self-hosting on vanilla Node 20+ or Docker gets standard Node.js behavior, no Fluid benefits (no in-function concurrency, no cold-start pre-warm, no active-CPU billing). | None needed. Buyer gets a slightly different cost model. |
| **Vercel Functions (800s / 1800s max duration)** | Yes — the 17.13/17.14 agent loops and the 4.9 streaming jobs. With the 2026-06-15 changelog, **Pro and Enterprise support up to 1800s (30 min) on Node.js and Python with Fluid Compute enabled, opt-in via `maxDuration = 1800`; above 800s is BETA. Edge runtime is NOT covered.** | On a non-Vercel host, there is no max-duration ceiling; the process runs until it finishes or the host kills it. This is strictly more permissive. | None. Self-host is better here. |
| **Edge runtime** | Yes — the **control plane** is Edge (`app.deessejs.com`). The **tenant apps are Node.js** (the 17.x and 4.x work). The Edge control plane is the operator's, not the tenant's — the buyer does not run the control plane. | n/a for the buyer. | n/a. |
| **Vercel Cron** | Yes — declared in `vercel.json` for nightly meter flush, daily backups, hourly usage aggregation. | Vercel Cron doesn't run on a non-Vercel host. | The buyer wires the same cron expressions to **system cron + a `crontab` file** or **GitHub Actions cron** or **a Trigger.dev scheduled task** they own. The eject CLI emits a `crontab` fragment. |
| **Vercel KV** | **Deprecated.** Per Vercel docs, KV was retired in December 2024 and existing KV stores were auto-migrated to Upstash Redis. **DeesseJS Cloud never uses Vercel KV** — it uses Upstash directly. So nothing breaks. | n/a. | n/a. |
| **Vercel Blob** | **NOT used.** The locked stack is Cloudflare R2 (S3-compatible, zero egress). The `06-storage.md` feature inventory explicitly chose R2 over Vercel Blob. | n/a. | n/a. |
| **Vercel Image Optimization** | Used by Next.js `next/image`. | On a non-Vercel host, this falls back to the framework's default (works fine; buyer just pays CPU instead of Vercel's image opt). | None — Next.js handles it. |
| **Vercel Analytics / Speed Insights** | Not used in the locked stack. | n/a. | n/a. |
| **`x-vercel-project-id` header binding** | Yes — the `DEESSEJS_SECRET` JWT is bound to a Vercel project ID and validated server-side via that header. | On a non-Vercel host, the header doesn't exist. The `boot` handler must check `process.env.VERCEL_PROJECT_ID` env var instead. | Eject CLI sets `VERCEL_PROJECT_ID` to the buyer's own Vercel project ID (or omits the check entirely if the buyer is not on Vercel). |

**Net result:** of the 8 Vercel-specific surfaces audited, **only 1 (Vercel Cron) is a real blocker**, and it's resolved by a 5-line crontab. The rest are non-issues because either (a) Cloud doesn't use them (KV, Blob), (b) the buyer is better off without them (1800s max duration), or (c) the binding check is one env var.

---

## 4. The "resolved per-service credentials" pattern: what is in the clipboard?

**It is an env file, not a JWT alone.** Here's why a JWT-only clipboard is theater:

- A JWT signed by the operator's EdDSA key is verifiable but **it only encodes pointers** (Turso URL, Upstash URL, Trigger project ref). The actual *secrets* — the Turso auth token, the Upstash REST token, the R2 secret key, the Resend API key — are not in the JWT. The operator's `/api/internal/boot` endpoint exchanges the JWT for the resolved secrets on first request. **Without the operator's control plane running, the JWT is useless.**
- The whole point of an escape hatch is that the buyer doesn't need the operator's control plane. So the clipboard must contain the **resolved secrets** themselves, not a signed reference to them.

**Two-tier disclosure model** (recommended):

1. **At all times, in the operator admin dashboard** (21.x): a `DEESSEJS_SECRET` field (the JWT) plus a one-click "Regenerate" button. This is the buyer's *daily* access pattern (rotate, re-deploy).
2. **On ejection request** (POST to `/tenants/{id}/eject`): the operator returns a **signed tarball** with the full secret set, valid for 24 hours, download once. The operator then revokes the JWT, marks the tenant `ejected: true`, and removes the Turso DB and R2 prefix after a 30-day grace period.

**What is in the tarball** (concretely):

```
tenant-XXXX-eject-2026-06-18.tar.gz
├── .env                              # 25-30 env vars, all secrets resolved
├── DATABASE_DUMP.sql                 # `turso db export` (libSQL binary, default <name>.db)
├── r2-manifest.json                  # list of `t:{tenantId}/` keys with sizes + etags
├── trigger-runs.jsonl                # one run per line, JSON, payload + output + status
├── resend-sent-log.csv               # via Resend's data export API
├── bind-zone.txt                     # BIND-format zone file (256 KiB cap)
├── EJECTION.md                       # 12-step runbook
├── crontab.fragment                  # system-cron equivalent of vercel.json cron
├── docker-compose.yml                # for local replay (libSQL, redis, MinIO, mailpit)
└── SHA256SUMS                        # integrity check
```

The `.env` is the **first-class artifact** for the buyer — they copy it into a Vercel project's environment variables and the app boots. The SQL dump is the **second-class artifact** — they restore it to their own Turso database, then update `TURSO_URL` and `TURSO_TOKEN` in the env.

**Security properties of the tarball:**

- Encrypted at rest with a per-eject passphrase (the buyer supplies it during the eject request, or it's generated and shown once).
- Signed with the operator's ed25519 key; the signature is verifiable to prove the tarball came from the operator.
- Delivered over a one-time signed URL (Vercel Blob private + 24h expiry, or equivalent), not emailed.
- The clipboard field in the admin dashboard never shows the full tarball — it shows the JWT (the daily-use credential) plus a "Request full eject bundle" button.

---

## 5. Domain transfer: Resend sender domain + Cloudflare DNS zone

This is the slowest and most error-prone part of the eject ritual. It is also the part that breaks deliverability if done wrong.

### 5a. Resend sender domain transfer

**The current state on Cloud:** the operator's Resend account owns a domain like `mail.{tenant}.deessejs.com` (or `{tenant}.deessejs.com`) for each tenant. Per the feasibility, the platform holds the domain and per risk #4, "Resend sender domain ownership transfer after first deploy" is the *post-ejection* deliverable.

**Resend's documented behavior:** the docs do not currently expose a single "transfer domain" API. The platform's options are:

1. **DNS-only transfer (most common):** the buyer creates a *new* Resend account (or uses their existing one), adds the same domain, and Resend re-issues a new DKIM key pair. The buyer updates the 3 DNS records (DKIM TXT, SPF TXT, MX) at their DNS host. **The new DKIM key is different from the operator's** — this is a clean break, no shared trust.
2. **Account merge / domain move (if Resend supports it on the buyer's plan):** the operator removes the domain from their account, the buyer adds it to theirs. The DKIM keys may or may not be preserved depending on the Resend implementation; buyer must re-verify.
3. **No-op: buyer keeps the subdomain under the operator's Resend account.** The simplest path, but the buyer does not own their sending reputation.

**Time estimate:** 10-60 minutes for DNS propagation. **Risk:** if the buyer is on a corporate domain (e.g., `mail.acme.com`), losing the DKIM key during transfer triggers a 1-7 day warm-up period with Gmail/Yahoo/Microsoft as they re-learn the sender. *This is a real business risk for production SaaS tenants — eject is not zero-downtime for email deliverability.*

**What the eject CLI ships:** a `domain-transfer.md` file with the exact DNS records to update, the new Resend API key field, and a checklist of 5 verification steps (Resend domain status → DKIM verified → SPF verified → MX verified → test send).

### 5b. Cloudflare DNS zone transfer

The operator owns the wildcard `tenants.deessejs.com` zone in Cloudflare and assigns subdomains like `acme.tenants.deessejs.com` to tenants. **Two scenarios on eject:**

1. **Buyer keeps the `{tenant}.tenants.deessejs.com` subdomain** (the easy path): the operator keeps the zone but the buyer updates the A/AAAA record to point at the buyer's Vercel project / Cloudflare Pages project / wherever the buyer hosts. **The zone file never moves; only one record changes.** Time: 5 min - 24 hr (DNS TTL). The operator also needs to remove the wildcard `*.tenants.deessejs.com → operator-tenant-router` and add a specific `acme.tenants.deessejs.com → buyer-IP` record.
2. **Buyer takes the whole zone elsewhere** (the hard path): Cloudflare supports both intra-account and inter-account zone transfers; for external (non-Cloudflare) registrars, the buyer needs the BIND zone file (which Cloudflare exports in standard format, 256 KiB cap) and to re-point nameservers at the registrar. Time: **24-72 hours** for NS propagation globally. **Risk:** during the NS handoff, the tenant URL is intermittently unreachable.

**Cloudflare BIND export is well-supported** — `GET /zones/{id}/dns_records/export` returns the full zone in BIND format with cf-proxied tags. The 256 KiB cap is not a problem for a single tenant zone (typically <5 KiB).

### 5c. Vercel custom domain

The buyer's Vercel project (the one they create to receive the ejected app) is assigned the custom domain in the Vercel dashboard. Vercel auto-issues the SSL cert via Let's Encrypt. Time: 5-10 min.

---

## 6. Stripe Connect Standard ejection: what does the buyer keep, what does the operator lose?

**Short answer: the buyer keeps their Stripe account and all of their customer data. The operator loses the billing relationship but never had it in the first place.**

Per the Stripe Connect Standard docs: a Standard account is "a regular Stripe account that has a direct relationship with Stripe, can log in to the Dashboard, and can process its own payments." The platform's KYC access **ends after the first account link** — the platform cannot read or write the connected account's compliance data after onboarding.

**Implications for the eject flow:**

- **The buyer's Stripe account is theirs from day 1.** It is not a sub-account of the platform. The platform never sees the buyer's KYC, bank account, or tax info after the first onboarding link is consumed.
- **The buyer's customers, subscriptions, and charges live in the buyer's connected account, not the platform's.** On eject, the buyer retains all of this without any transfer step.
- **The platform's relationship is the application fee + the application-fee refund + the platform's commission on Connect charges.** The platform can stop receiving application fees by revoking its API key for that connected account, but it cannot "pull" customers or charges back.
- **The buyer needs a new Stripe API key** to point their self-hosted app at their own Stripe account. The operator's secret key is revoked.
- **The 21.x admin dashboard loses visibility into the buyer's MRR** as soon as the operator revokes its Stripe API access. This is fine — the eject button itself triggers a final MRR snapshot for the record.

**This is the cleanest of the five transfer scenarios.** The platform never held the buyer's billing data. The "transfer" is a 30-second key rotation, not a data migration.

---

## 7. Post-ejection delta: what does the buyer lose?

The escape hatch is honest about *data* portability but the buyer does lose **platform value**. Documenting this delta is a marketing requirement (the buyer needs to know what they're giving up) and a product requirement (the operator needs to know what's missing so v2 can close the gap).

| Lost capability | Severity | Workaround |
|---|---|---|
| **Operator admin dashboard (21.x)** | High for ops teams, low for solo founders | The buyer wires their own (Sentry, Logflare, custom Next.js admin) — or runs without it. |
| **Auto-updates** (push to `deessejs-cloud-template` → fan-out to all tenants) | **High.** Buyer is now responsible for `git pull && vercel deploy` on every dependency update. | The template repo keeps the same `main` branch; the buyer subscribes to GitHub releases. The operator's deploy hook goes away. |
| **CVE patches** (operator ships a fix within 24h of disclosure) | High for security-conscious buyers | The buyer's auto-update problem above. They have to apply patches themselves. |
| **Daily backups** (Turso automatic, R2 cross-region replication) | Medium | Turso backups continue working (Turso's daily backup is built into the platform). R2 cross-region replication is the buyer's responsibility. The eject tarball IS a backup; the buyer should keep weekly copies. |
| **Uptime monitoring** (operator dashboard 21.12) | Low | Buyer wires Better Stack, UptimeRobot, or Checkly. |
| **Per-tenant LLM cost tracking** (17.15) | Medium — this is the *headline feature* on Cloud | The metering SQL is in the template repo (it's a Turso table + a 17.15 hook). The buyer still has it on self-host, **but loses the Stripe metered-usage automation that bills the tenant** — they have to roll their own. |
| **Per-tenant rate limit** (17.16/17.17) | Low | The Upstash Ratelimit calls are in the template; works on self-host against the buyer's Upstash. |
| **Per-tenant daily command counter** (the 60s poison-pill kill switch from A4) | Low | The buyer keeps the code, but loses the *operator's* ability to suspend a misbehaving tenant's Upstash key. Self-hosted means self-managed. |
| **The DEESSEJS_SECRET rotation flow** (operator-managed) | Low | The buyer rotates the secret by `vercel env rm` + `vercel env add` themselves. |
| **Stripe Connect onboarding** (the buyer already has a connected account, so they keep it; but the operator's onboarding UI goes away for *new* customers) | n/a for the ejecting buyer | The buyer uses Stripe's hosted onboarding directly for any new customers. |
| **Vercel 12-concurrent-builds ceiling** | n/a — the buyer is on their own Vercel account with their own ceiling | Buyer upgrades to Vercel Pro or Enterprise if they need more. |
| **Compliance certifications** (SOC2, HIPAA) | High for regulated buyers | The operator's compliance posture doesn't transfer. The buyer needs their own. *This is a major reason Enterprise tier pricing is $2,500+/mo — the buyer is buying the operator's compliance, not just the technology.* |
| **Support tier** (email, Slack channel) | Medium | Buyer is on their own. The 30-day post-eject email support is the only handoff. |
| **Status page + incident communication** | Low | The operator's `status.deessejs.com` doesn't include the buyer's app. |
| **Multi-tenant features** (the operator's value-add is the *managed* tier, not the *multi-tenant* tier) | None — DeesseJS v1 is multi-tenant by design; the buyer keeps it on self-host | n/a. |

**The single most important sentence in this section:** *ejection is a data and code migration, not a service migration. The buyer keeps their data, their code, and their tenant's customer relationships; the buyer loses the operator's day-2 operational layer.*

---

## 8. Open questions for the synthesis agent

1. **Should the operator offer a paid "managed eject" service?** ($500-2000 one-time fee for a human to do the 4-6 hour DevOps session for the buyer.) This is a natural upsell and removes the biggest friction from the escape hatch.
2. **Should the operator publish the `EJECTION.md` runbook publicly on deessejs.com/docs/eject**, or keep it operator-only behind the admin dashboard? The answer is "publish it" — *the existence of a well-documented eject path is itself a marketing asset*; the operator's job is to be good enough that buyers don't use it.
3. **Is the daily-command Upstash cap a real blocker for ejection?** If a buyer is on a Team plan with 5M Upstash commands/mo, ejecting requires a 1M+ key SCAN over 1-2 hours. Upstash's daily request limit on a free DB is 10k. The buyer needs a paid Upstash DB to receive the export, OR a local Redis for staging. Recommend the eject CLI emit a `redis://localhost:6379` docker-compose option for staging replay.
4. **What is the SLA on the eject tarball delivery?** Recommend 24 hours from request, with a 30-day grace period before the operator deletes the Turso DB. Standard practice at Supabase, Vercel, and Railway.
5. **The Resend DKIM key rotation is the only eject step that can lose the buyer money** (1-7 day email deliverability warmup). The eject CLI must surface this as a warning, and the buyer should be encouraged to set up the new DKIM record 7 days *before* deleting the old one (overlap period). Worth designing for.
6. **The 2026-06-15 Vercel 1800s duration changelog does not change the eject story** — self-host is already unconstrained on duration. But it does change the *Cloud* story: long agent loops can now stay on Cloud up to 30 min, removing the "must use Trigger.dev" pressure for 17.13/17.14. Trigger.dev is still preferred for *persistence* and *retry semantics* across deploys, but the duration ceiling is no longer a forcing function. *Re-evaluate A4's "Trigger.dev-only" recommendation in light of this.*

---

## 9. Sources

- [Turso CLI db/export](https://docs.turso.tech/cli/db/export) — SQLite binary output, `--output-file`, `--with-metadata`, generation snapshot semantics
- [Turso CLI db/shell](https://docs.turso.tech/cli/db/shell) — stdin/SQL-file restore via `turso db shell <db> < dump.sql`; `.dump` is the inverse
- [Turso CLI db/import](https://docs.turso.tech/cli/db/import) — requires WAL journal mode on the imported SQLite file
- [Upstash Redis backups](https://upstash.com/docs/redis/features/backup) — daily backup, 1 or 3 day retention, restore to any DB in the account
- [Upstash Redis REST API](https://upstash.com/docs/redis/features/restapi) — SCAN is supported but requires Standard token (not read-only); no public RPS limit
- [Stripe Connect Standard accounts](https://docs.stripe.com/connect/standard-accounts) — connected account has direct Stripe relationship, merchant of record, KYC access ends at first account link
- [Resend domains](https://resend.com/docs/dashboard/domains/introduction) — DKIM/SPF/DMARC TXT records, 72-hour verification, no public transfer API documented
- [Cloudflare DNS records import/export](https://developers.cloudflare.com/dns/manage-dns-records/how-to/import-and-export/) — BIND zone file, 256 KiB cap, GET `/zones/{id}/dns_records/export`, 3 req/min
- [Vercel Edge runtime](https://vercel.com/docs/functions/runtimes/edge) — 25s initial response / 300s streaming, code-size limits by plan, Node.js subset, no FS
- [Vercel Functions 30-minute duration (changelog 2026-06-15)](https://vercel.com/changelog/vercel-functions-can-now-run-up-to-30-minutes) — Pro/Enterprise, Node.js + Python, Fluid Compute required, opt-in via `maxDuration=1800`, BETA above 800s, Edge NOT covered
- [Vercel Fluid Compute](https://vercel.com/docs/fluid-compute) — default since 2025-04-23, optimized concurrency, active-CPU billing, max duration by plan (Pro 800s / 1800s beta)
- [Vercel KV](https://vercel.com/docs/redis) — deprecated, auto-migrated to Upstash in Dec 2024, Cloud does not use it
- [Vercel Blob](https://vercel.com/docs/vercel-blob) — used by NOT chosen; locked stack uses Cloudflare R2
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) — `vercel.json` cron expression, UTC only, `vercel-cron/1.0` user agent, doesn't run on non-Vercel host
- [Trigger.dev v3 runs](https://trigger.dev/docs/runs) — `runs.list()` with cursor pagination, run = payload + status + output + timestamps, no built-in bulk export documented; per-tenant project structure is operator's design choice (not the vendor's)
- [v1 features inventory](../features/) — the 23-surface taxonomy that this analysis maps
- [feasibility 2026-06](../deessejs-cloud-feasibility-2026-06.md) — 12-step provisioning flow, 5 risks, the "escape hatch" line on line 58
