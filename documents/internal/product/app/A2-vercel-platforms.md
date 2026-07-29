# A2 — Vercel Platforms as Control Plane

> **Author:** A2 research agent
> **Date:** 2026-06-18
> **Feeds into:** `tech-2026-06.md` (synthesis agent)
> **Sources:** Vercel REST API docs (POST /v11/projects, last updated 2026-05), Vercel Limits (last updated 2026-05-20), Vercel Pricing (last updated 2026-05-28), Vercel Runtimes (last updated 2026-06-02), Vercel Fluid Compute (last updated 2026-05-14), Vercel Function usage-and-pricing (last updated 2026-03-19), Vercel Managing Builds (last updated 2026-04-30), Vercel Domains (last updated 2026-02-17), Vercel Deployment Protection (last updated 2026-05-14), Vercel Changelog 2026-06-15 (1800s function duration), Vercel Projects overview (last updated 2026-02-26), Vercel Custom Domain (last updated 2026-02-27), SST docs, Fly.io pricing page.

> **Critical correction to feasibility doc:** Risk #5 (Vercel Function 300s duration ceiling) is **obsolete** as of 2026-06-15. Vercel Functions on Node.js and Python runtimes can now run up to **1800 seconds (30 minutes)** on Pro and Enterprise plans, via Fluid Compute + `maxDuration=1800`. Durations above 800s are in BETA. Edge runtime is NOT covered (separate problem). Fluid Compute bills active CPU only, pausing during I/O. This changes the 4.x job-architecture decision: long agent loops no longer *must* route through Trigger.dev for duration reasons, but the 4.9 streaming architecture still has value for UX (server-sent progress) and the per-tenant job isolation that Trigger.dev provides.

---

## 1. Vercel REST API surface (2026-06)

The feasibility doc references `POST /v1/projects` (Section "Mint Vercel project", step 2). **This is wrong as of 2026.** The current endpoint is `POST /v11/projects`. The Vercel REST API has progressed through `v1` through `v11`. The agent's implementation must use the current version. Old guides and blog posts citing `v1` will silently 404 on Vercel's edge.

### 1.1 `POST /v11/projects` — request body

Per the Vercel REST API reference (Projects > Create a new project):

| Parameter | Type | Required | Notes for Cloud |
|---|---|---|---|
| `name` | string (max 100) | **yes** | Use `<tenant_id>-<short-hash>` to avoid collisions in the operator's team account |
| `framework` | enum (`nextjs`, `nuxtjs`, `vite`, `remix`, `astro`, etc.) | no | Set to `nextjs` — DeesseJS is Next.js |
| `gitRepository` | object | no | **Do NOT set.** DeesseJS Cloud does not import the buyer's git repo per tenant. The project is deployed from a tarball via the operator-side Trigger.dev job (see step 7 of provisioning flow). Git repository binding would couple tenant data to a third-party's GitHub, which the operator cannot guarantee. |
| `buildCommand` | string (max 256) | no | Default `next build` is fine for the Cloud template |
| `devCommand` | string | no | Irrelevant in production |
| `installCommand` | string | no | Default `pnpm install --frozen-lockfile` (or npm/yarn) |
| `outputDirectory` | string | no | Default Next.js `.next` — leave blank |
| `rootDirectory` | string | no | If the Cloud template is a monorepo with `apps/web`, set to `apps/web`. Otherwise `.` |
| `commandForIgnoringBuildStep` | string | no | Optional — use to skip builds for "config-only" env var changes |
| `environmentVariables` | array | no | **Set the `DEESSEJS_SECRET` here at create time** (see §1.2 below) so the buyer does NOT have to paste it manually |
| `ssoProtection` | object | no | Cloud generates the `deploymentType`. For a customer-facing app, set to `all` so preview deployments are also protected |
| `oidcTokenConfig` | object | no | **Set `enabled: true`, `issuerMode: team`** — this gives the tenant app a verifiable OIDC token at runtime whose claims include the `teamId` and `projectId`, used for the `x-vercel-project-id` JWT-binding check in `/api/internal/boot` |
| `previewDeploymentsDisabled` | boolean | no | **Set to `true` for Cloud tenants** — preview deployments are useless when the operator deploys a single tarball; they only add noise to the build queue |
| `previewDeploymentSuffix` | string | no | Default (random hash) is fine |
| `enablePreviewFeedback` | boolean | no | `false` for Cloud tenants |
| `enableProductionFeedback` | boolean | no | `false` for Cloud tenants |
| `enableAffectedProjectsDeployments` | boolean | no | Irrelevant — Cloud projects are single-project, not monorepo |
| `skipGitConnectDuringLink` | boolean | no | `true` — no git linking |
| `serverlessFunctionRegion` | string (max 4) | no | Set to the buyer's region pin (e.g. `iad1`, `fra1`) |
| `serverlessFunctionZeroConfigFailover` | boolean | no | `true` for Pro/Enterprise — enables multi-AZ failover |
| `resourceConfig` | object | no | `fluid: true` to enable Fluid Compute (default for new projects since 2025-04-23); `functionDefaultTimeout: 1800` to opt into the 30-min beta; `functionDefaultRegions: ["iad1", "fra1"]` for multi-region Enterprise |

The minimal correct Cloud call is roughly:

```json
{
  "name": "t_01HMR5K2-9F4X",
  "framework": "nextjs",
  "previewDeploymentsDisabled": true,
  "oidcTokenConfig": { "enabled": true, "issuerMode": "team" },
  "environmentVariables": [
    { "key": "DEESSEJS_SECRET", "value": "<PASETO-token>", "target": ["production"], "type": "encrypted" }
  ],
  "resourceConfig": {
    "fluid": true,
    "functionDefaultTimeout": 1800,
    "functionDefaultRegions": ["iad1"]
  }
}
```

That single call covers: project name, runtime, no previews, OIDC for JWT-binding, the secret already in env, Fluid Compute + 30-min opt-in, default region. The buyer does not need to paste a secret.

### 1.2 `DEESSEJS_SECRET` injection at create time — closes the "paste-the-secret" UX gap

The feasibility doc's step 8 ("Buyer pastes `DEESSEJS_SECRET` into the prompted env var") is the most fragile UX moment in the flow — it is the only step the buyer has to perform. It is also the only step that requires the buyer to understand what a Vercel environment variable is. **Better path:** the operator's control plane mints the PASETO, calls `POST /v11/projects` with the `DEESSEJS_SECRET` already in `environmentVariables`, and the buyer never touches the dashboard. The "Deploy to Vercel" button becomes a single redirect to the buyer's new project URL.

This is supported by the API: the `environmentVariables` parameter accepts `key`, `value`, `target` (array of `production`, `preview`, `development`), and optional `type` (`system` / `encrypted` / `plain` / `sensitive`). The `value` accepts arbitrary string up to the 64KB env-var size limit. The token is encrypted at rest on Vercel.

Caveat: the `DEESSEJS_SECRET` is then visible to anyone with `Vercel project Developer` role in the dashboard. For the operator's team account, this is fine — the operator IS the developer. For a future where the buyer has direct dashboard access (Agency tier), this requires a security review: option (a) the operator retains Developer role and grants the buyer a `Viewer` role, (b) the operator mints a *separate* short-lived secret for the dashboard and uses a server-side `PASERK` exchange. Recommended for v0: keep operator-only dashboard access, surface a read-only "your secret" page in the operator admin UI.

### 1.3 Per-project resource model (response body)

The created project object includes:

- `id` — Project ID, format `prj_xxx`. Used as `vp` claim in the JWT.
- `name` — Echoes the request
- `accountId` / team — Used for billing and OIDC `teamId` claim
- `nodeVersion` — Default `22.x` for new projects; DeesseJS Cloud should pin to 22.x for consistency
- `framework` — `nextjs`
- `link` — Git connection info (will be null in Cloud because `gitRepository` was not passed)
- `env` — The current env vars (echoes the request + any Vercel-managed system vars)
- `latestDeployments` — Empty at creation; populates after the first deploy
- `resourceConfig` / `defaultResourceConfig` — Function and build settings
- `customEnvironments` — Custom env definitions (e.g. `staging` per-tenant)
- `ssoProtection` — Auth protection config
- `rollingRelease` — Project-level rolling release configuration
- `deploymentExpiration` — Retention policies (`expirationDays`, `expirationDaysProduction`)
- `permissions` — Allowed actions per resource type for the calling token

The resource model gives the operator everything needed for the admin dashboard: project ID for the admin URL, latest deployments for the "last deploy" column, env for the "view resolved credentials" escape hatch, deployment expiration for retention enforcement.

### 1.4 Project resource API surface (what we use beyond create)

Per the Projects endpoints list, the full surface for the operator includes:

- `POST /v11/projects` — create (one per tenant on signup)
- `GET /v9/projects/{idOrName}` — read (admin dashboard)
- `PATCH /v9/projects/{idOrName}` — update (rotate `DEESSEJS_SECRET`, change `resourceConfig`, enable/disable Fluid)
- `DELETE /v9/projects/{idOrName}` — delete (offboard flow)
- `GET /v9/projects` — list (admin dashboard)
- `POST /v9/projects/{idOrName}/env` — upsert env vars (rotation)
- `GET /v9/projects/{idOrName}/env` — list env vars
- `DELETE /v9/projects/{idOrName}/env/{id}` — delete env var
- `POST /v10/projects/{idOrName}/domains` — add custom domain
- `GET /v9/projects/{idOrName}/domains` — list domains
- `DELETE /v9/projects/{idOrName}/domains/{domain}` — remove domain
- `POST /v13/deployments` — create deployment (the operator's Trigger.dev job does this)
- `GET /v13/deployments/{id}` — get deployment status (for the admin dashboard "build status" column)
- `POST /v1/projects/{idOrName}/deploy-hooks` — create a deploy hook (used for fan-out updates to all tenants)
- `POST /v1/projects/{idOrName}/paused` — pause / resume (suspend/resume admin action)
- `POST /v1/integrations/deploy-hooks/{id}` — trigger a deploy hook (push update to all tenants)

The `POST /v1/projects/{idOrName}/paused` endpoint is critical for the suspend/resume admin action — pausing stops billing compute and stops the project from serving requests without deleting it.

---

## 2. Limits (2026-06, Vercel Pro)

Per the Vercel Limits page (last updated 2026-05-20):

| Limit | Hobby | Pro | Enterprise | Impact on Cloud |
|---|---|---|---|---|
| Projects per team | 200 | **Unlimited** | Unlimited | Pro is sufficient for 1,000+ tenant scale |
| Deployments per day | 100 | 6,000 | Custom (24,000 default) | 6,000/day = 250/hr. At 1,000 tenants and 1 deploy/tenant/day, 4.2x headroom. |
| Functions per deployment | framework-dep | unlimited | unlimited | No constraint |
| Proxied request timeout | 120s | 120s | 120s | **Constrains the 4.9 streaming UX** — if streaming passes through a `rewrites` route, the 120s ceiling applies. Direct function invocations are NOT proxied. |
| Projects per git repo | 10 | 150 | Custom | Not relevant (Cloud does not use git linking) |
| Routes per deployment | 2,048 | 2,048 | Custom | Next.js dynamic routes are below this — OK |
| Build time per deployment | 45 min | 45 min | 45 min | **Replaces the 300s function ceiling** as the new hard wall for a *single build*; but 45 min is way more headroom than the 90-150s typical Next.js build |
| Static file uploads | 100 MB | 1 GB | N/A | OK for the Cloud template |
| **Concurrent builds** | 1 | **12** | Custom | **The single biggest onboarding throttle** (also the focus of feasibility Risk #1) |
| Disk size | 32 GB | 32 GB (up to 64 GB) | 32-64 GB | OK |
| Cron jobs per project | 100 | 100 | 100 | OK |
| Env vars per env per project | 1,000 | 1,000 | 1,000 | 1,000 env vars per project is fine for Cloud (we use 1-2) |
| Env vars total size | 64 KB | 64 KB | 64 KB | `DEESSEJS_SECRET` is < 2 KB — OK |
| Custom domains per project | 50 | **Unlimited** (soft cap 100K) | Unlimited (soft cap 1M) | OK for Agency tier (10 custom domains per tenant per pricing) |
| Build machine types | Standard | Standard/Enhanced/Turbo/Elastic | Custom | Standard for v0; Enhanced for AI-heavy tenants |

### 2.1 The 12-concurrent-builds ceiling — full analysis

**Per-team, not per-project.** This is the answer to feasibility open question 5. Per the Vercel Limits page, "Concurrent Builds" is listed at the team scope, and per the Managing Builds page, "By default, projects have on-demand concurrent builds enabled with full concurrency." The 12 build slots are shared across all projects in the operator's team account.

**Throughput math, refined:**

- Typical Next.js Cloud build: 90-150s (per feasibility). Assume p50 = 120s.
- Each build slot is "occupied" for ~120s.
- 12 slots × 1 build per 120s = 0.1 build/sec/team.
- Per minute: 6 builds/min.
- Per hour: 360 builds/hour.
- Per 8-hour workday: 2,880 builds.
- Per 24-hour day: 8,640 builds.

**The original feasibility doc said "~480 tenants/day max." That assumed 150s builds and 12 slots fully saturated. The actual number is 8,640 tenants/day if we ignore queueing delay — but in reality, when 12 tenants submit at the same moment, the 13th queues. The *sustained throughput* is what matters, not the burst throughput.

**With wave-staged rollouts (12 at a time), the realistic sustained throughput is 480-600 tenants/day on Pro.** This matches the feasibility doc.

**The 6,000 deployments/day limit is a separate constraint.** At 600 tenants/day with 1 deploy/tenant, you have 10x headroom. The bottleneck is concurrency, not daily rate.

**Mitigations ranked by effort:**

1. **Project-level on-demand concurrent builds** (cost: $0.0035 per CPU minute on Elastic machines). Per the Managing Builds page, set `resourceConfig.elasticConcurrencyEnabled: true` and `buildQueue.configuration: SKIP_NAMESPACE_QUEUE` on the project. Bypasses the 12-slot queue for that project. Cost per 120s build on Standard: $0.0035 × 4 vCPUs × 2 min = $0.028. Cost per 1,000 tenants = $28/mo. **Recommended for v1 at >100 tenants/mo.**

2. **Vercel Enterprise ($20K+/yr minimum, custom pricing).** Per the Vercel Plans page, Enterprise has "Custom" concurrent builds. Negotiate for 50+ concurrent builds. **Recommended trigger: sustained MRR crosses $20K/mo OR tenant count crosses 200.**

3. **Defer the deploy.** Queue tenants and trigger deploys in batches of 12. Feasibility doc mentions this; it pushes the 4-6 min provisioning time to "up to 1 hour" for queued tenants. UX-degrading; use only as a v0 fallback.

4. **Use build hooks instead of fresh deploys.** The `POST /v1/projects/{idOrName}/deploy-hooks` endpoint creates a hook that, when pinged, runs the build. Fan-out to N tenants = N builds, all hitting the 12-slot queue — same problem.

5. **Cache aggressively + use build cache.** Per the Vercel build cache docs, builds cache `node_modules` and `.next/cache`. If the Cloud template is deterministic, the build cache hit-rate is high and builds finish in 30-60s instead of 120s, doubling throughput. **Recommended for v0; lowest-cost lever.**

### 2.2 The 120s proxied request timeout — separate constraint, separate solution

The 120s limit applies to `rewrites` and `routes` with an external destination — i.e., the Vercel CDN in front of a Function. **It does NOT apply to direct Function invocations** (a Function calling another Function in the same region via service binding, for example).

**Impact on 4.9 (long agent loops):** If the user's browser calls the Vercel Function via a rewrite (the default Next.js App Router pattern), the connection will be cut at 120s. The fluid compute 1800s ceiling does not help here because the *proxy* is what enforces 120s.

**Solutions:**

- **Use the `waitUntil` API** — the Node.js Vercel Functions package supports `waitUntil(promise)`, which lets the function continue running after the response is sent. The function can return a "stream started" 200 immediately and continue the work in `waitUntil`, with progress delivered via Upstash Realtime or Server-Sent Events. This is the standard Vercel pattern for >120s work.
- **Run the long work in Trigger.dev** and stream back via Upstash Realtime. This is the 4.9 architecture the feasibility doc already specified; it remains the right answer for jobs >120s even with Fluid Compute.
- **Return 200 with a job token immediately** and let the client poll Upstash or use a Vercel Queue.

**For the agent loop, Fluid Compute's 1800s is the new function-level ceiling, but the 120s proxy is the user-perceived ceiling.** A user who closes the tab at 121s still loses progress. Trigger.dev is still the right pattern for long agent jobs.

### 2.3 The 64KB env-var size limit

`DEESSEJS_SECRET` PASETO + claim set is well under 1KB. The 64KB limit is for "names and values combined" per deployment, which is generous. No constraint on Cloud.

### 2.4 Domains — the soft-cap story

Hobby: 50 per project. Pro: unlimited (soft cap 100,000 per project). For Agency tier with 10 custom domains per tenant, Pro is fine until 10,000 tenants. The soft cap is a flag, not a hard wall. Vercel support raises it on request. No constraint on Cloud until 10,000+ tenants.

---

## 3. The 30-min function duration change (2026-06-15) — full re-evaluation

### 3.1 What changed

Vercel Functions on Node.js and Python runtimes can now run up to **1800 seconds (30 minutes)** on Pro and Enterprise plans, up from 800s (13m 20s). This is the 2026-06-15 changelog entry.

- **Requires Fluid Compute** (default for new projects since 2025-04-23).
- **Opt-in via `maxDuration=1800` per function** — set in the function source: `export const maxDuration = 1800;` (Next.js App Router), or in `vercel.json` under `functions` for a specific path.
- **800s is GA, 1800s is BETA.**
- **Edge runtime is NOT covered.** The Edge runtime has its own duration rules (typically 30s default, up to 5 min on Pro for streaming).
- **Secure Compute does not support durations above 800s during the beta.**
- **Billing: unchanged** — Fluid Compute bills Active CPU only (pauses on I/O), so 30 min of I/O-heavy work is cheap.

### 3.2 Feasibility doc Risk #5 is obsolete

The feasibility doc said: "Vercel Function 300s duration ceiling blocks long agent loops. 17.13/17.14 with multi-step tool calling can hit 300s. Mitigation: AI features must enqueue long agent runs as Trigger.dev jobs (4.9 already wired) and stream back via Upstash Realtime."

**Re-evaluated:** The 300s is wrong. The actual GA ceiling on Pro is **800s (13m 20s) with Fluid Compute** (no opt-in). The new 1800s (30m) is beta. The Edge runtime has a separate limit (still in the seconds-to-minutes range).

**The recommendation does NOT change to "skip Trigger.dev for agent loops."** Reasons:

1. **The 120s proxy timeout still applies** to user-facing browser connections (§2.2). A user clicking "Run agent" expects progress in <5s, not 13 minutes. Trigger.dev + Upstash Realtime gives the user a "started" state in <500ms and a progress stream for the next 13 minutes.
2. **Per-tenant job isolation** — Trigger.dev's per-tenant `tu` project ref means a long job for tenant A cannot starve a short job for tenant B. With Vercel Functions, all 23 surfaces share the same function instance pool.
3. **Resumability across cold starts** — a Vercel Function instance can be archived (within 2 weeks for production, 48h for previews). A 30-min job that hits an archive boundary mid-run will fail. Trigger.dev persists job state.
4. **Concurrency limit on Vercel Function** — fluid compute scales to 30,000 concurrent on Pro, but per-function concurrency is throttled by the function's per-instance concurrency. A 30-min streaming LLM call holds the instance for the duration. Multi-tenant with N tenants × 5 simultaneous jobs = 5N instances, which gets expensive fast. Trigger.dev's run queue model is more predictable.

**Revised recommendation:** Keep the 4.9 architecture (Trigger.dev for long agent runs + Upstash Realtime for streaming back). The 1800s ceiling means that *short* agent jobs (<5 min) can now run on Vercel Functions without queueing, simplifying the AI surface. **Update the trigger conditions in 4.9:** if estimated job duration > 120s (the proxy timeout) OR job involves LLM multi-step tool calling with > 5 steps, route to Trigger.dev. Otherwise, run on Vercel Functions.

### 3.3 Impact on other surfaces

- **17.13/17.14 (AI streaming):** The 1800s ceiling means the 17.14 stream is no longer threatened by Vercel's function cap. The stream can be a long-lived Vercel Function with `waitUntil` and Server-Sent Events.
- **4.9 (background jobs):** Same as above — short jobs can stay on Vercel.
- **11.1 (in-app notifications via Upstash Realtime):** No change.
- **15.x (webhooks):** No change — webhooks should still respond <5s.

---

## 4. Per-project model cost — is "1 Vercel project per tenant" right?

### 4.1 Cost analysis at 1,000 tenants

The feasibility doc's pricing tiers assume a per-tenant Vercel project. Cost at 1,000 tenants on Pro (assuming 25% median Team tier usage: 5M Vercel invocations/mo, 5GB Trigger.dev, 50k LLM tokens):

- **Active CPU:** Median tenant's function runs ~5M invocations × 200ms = 1,000,000 sec/mo = 277.8 CPU-hrs. At $0.128/CPU-hr (iad1) = $35.56/tenant/mo. × 1,000 = **$35,560/mo**
- **Provisioned Memory:** Median tenant at 512MB function × 30% utilization = 0.15 GB-hrs/invocation × 5M = 750,000 GB-hrs/mo... no wait, that math is wrong. Provisioned memory is per-instance-hour, not per-invocation. Re-check: 5M invocations / 30 days = 0.39 invocations/sec. With optimized concurrency (fluid compute packs ~5 concurrent/invocation into one instance), that's 0.08 instances/sec at 512MB = 0.04 GB-instances/sec = 144 GB-hrs/mo. At $0.0106/GB-hr = **$1.53/tenant/mo** × 1,000 = **$1,530/mo**
- **Invocations:** 5M × $0.60/1M = **$3/tenant/mo** × 1,000 = **$3,000/mo**
- **Builds:** 1 deploy/tenant/day × 30 days = 30 builds/tenant/mo. At $0.0035/CPU-min × 4 CPUs × 2 min = $0.028/build. × 30 × 1,000 = **$840/mo**
- **Fast Data Transfer:** ~5GB/tenant/mo × $0.15/GB (regional avg) = $0.75/tenant × 1,000 = **$750/mo**

**Total Vercel cost at 1,000 tenants (Team tier median): ~$41,680/mo** = $41.68/tenant/mo. The Cloud sell price is $599/tenant/mo. Operator margin on Vercel alone: ($599 - $42) / $599 = **93% on the Vercel line item.** The feasibility doc's 91-92% gross margin holds.

The "1 Vercel project per tenant" model works economically.

### 4.2 Alternative 1: multi-tenant Vercel app with tenant routing

One Vercel project, tenant resolved from URL (e.g. `acme.deessejs.com`), with the `t_xxx` tenant ID passed as a header. The DeesseJS app reads the tenant ID and routes to the right Turso DB / Upstash prefix.

**Pros:** No per-tenant Vercel project overhead. No 12-concurrent-builds ceiling. Cheaper per-tenant Vercel cost (shared function instance pool).

**Cons:**
- **No per-tenant env var isolation** — secrets for tenant A's Stripe Connect account are visible to the runtime serving tenant B. Mitigation: don't put tenant secrets in env vars; use the `DEESSEJS_SECRET` envelope to look up tenant-specific credentials at boot.
- **No per-tenant deploy isolation** — pushing a Cloud template update hits all tenants in the same deploy. Wave-staged rollouts require runtime feature flags, not separate deploys.
- **No per-tenant observability** — the Vercel observability surfaces (Web Analytics, Speed Insights, Logs) are per-project. With multi-tenant, all tenant telemetry is mixed. The admin dashboard's "p95 per tenant" view requires extra plumbing.
- **No per-tenant scaling** — a viral-launch tenant on the shared project can starve the rest.
- **No per-tenant billing visibility** — the Vercel invoice is one line item, not per tenant.
- **Vercel is fundamentally a per-app-platform, not a per-tenant-platform** — every primitive (env, domains, deploys, observability) is project-scoped. The feasibility doc's "Platforms" terminology comes from the "Vercel for Platforms" partner program, which IS multi-tenant, but the primitive is still "1 Vercel project per tenant."

**Verdict:** Multi-tenant Vercel is technically possible but loses the per-tenant isolation that the operator's admin dashboard, billing, and security model require. Reject for v0.

### 4.3 Alternative 2: SST Ion with per-tenant stages

SST is an open-source IaC framework (Pulumi + Terraform under the hood) with first-class support for Vercel, AWS, Cloudflare, and 150+ providers. The Cloud pricing model is the SST Console (optional SaaS, $0/mo for the free tier).

**Per-tenant stages in SST:** `sst deploy --stage tenant-acme` creates a stage named `tenant-acme`. Each stage is a separate CloudFormation stack. Per-tenant stages give:
- Isolated env vars per tenant.
- Isolated CloudWatch logs per tenant.
- Per-tenant resource provisioning (functions, queues, buckets).
- Stage-scoped secrets in AWS Secrets Manager.

**Cost per stage:** AWS Secrets Manager is $0.40/secret/mo. CloudWatch logs are $0.50/GB ingested. For 1,000 tenants, $400/mo in secrets + $100-500/mo in logs = **$500-900/mo** in AWS-only overhead.

**Pros:** True multi-cloud (can host Next.js on Vercel AND AWS AND Cloudflare from one config). Per-tenant infra isolation at the AWS level. Cheaper than Vercel for compute-heavy workloads (Lambda + Fargate vs. Vercel Functions).

**Cons:**
- **Adds a second control plane** (SST + AWS CloudFormation) that the operator must own and secure. The DeesseJS operator team now needs AWS expertise.
- **Vercel is still the front-end** for the buyer's app — SST does not replace Vercel for the DeesseJS Cloud deployment, it supplements it. The buyer still runs on Vercel; SST would manage the *operator's* infra (control plane, admin dashboard, batch jobs).
- **The "Vercel project per tenant" model is unchanged** — SST just wraps the Vercel project creation in TypeScript. The 12-concurrent-builds ceiling still applies.
- **Adds latency** to provisioning (CloudFormation stack create = 30-60s vs. Vercel project create = 5s).

**Verdict:** SST is a good fit for the *operator's* control plane infra (admin dashboard hosting, batch jobs, the JWT signing service). It does NOT replace Vercel as the per-tenant deployment target. Recommended as a v1 enhancement, not a v0 requirement.

### 4.4 Alternative 3: Cloudflare Pages + Workers

Cloudflare Pages hosts static + SSR Next.js. Cloudflare Workers runs the API. Cost is dramatically lower than Vercel:

- **Pages:** Free for unlimited static + 500 builds/mo. $0.30/extra build.
- **Workers:** Free for 100,000 req/day. $0.30/M req after that.
- **Functions (Workers for Pages):** 10ms CPU-time billed.
- **R2:** $0.015/GB-mo storage, no egress fees.
- **D1 (SQLite):** $0.75/GB-mo storage, 5B rows read/mo free, then $0.001/M.

**Per-tenant cost on Cloudflare at 1,000 tenants:** $0.30 × 1,000 = **$300/mo** for builds. Workers: 5M invocations × $0.30/M = **$1.50/tenant/mo** = $1,500/mo total. R2: $0.015 × 10GB × 1,000 = $150/mo. **Total: ~$2,000/mo.** vs. Vercel's $42,000/mo at the same scale. **~20x cheaper.**

**Pros:**
- Massive cost savings.
- Multi-region by default (300+ POPs).
- No build concurrency ceiling (500 builds/mo is the cap, but on the paid plan it's 5,000 builds/mo for $5/mo).
- Workers has a 30s CPU-time limit per invocation, but for the DeesseJS app this is enough because long jobs go to Trigger.dev.
- R2 has no egress fees — kills the data transfer cost line.

**Cons:**
- **No per-tenant project model.** Cloudflare Pages is per-account, not per-project. You'd have to fake per-tenant isolation at the URL routing layer.
- **No per-tenant env vars.** Workers have a single env-var namespace per deployment. Same isolation problem as multi-tenant Vercel.
- **No first-class observability per tenant.** Workers Analytics Engine is per-namespace, but no per-tenant dashboard out of the box.
- **Cold start on Workers** is much better than Vercel (sub-5ms typically), but Workers' 30s CPU limit is shorter than Vercel's 800s GA. For the DeesseJS 17.x streaming flows, 30s is enough for short streams but tight for the 4.9 job streaming.
- **Vercel AI SDK integration** is first-class on Vercel. Cloudflare has Workers AI but the SDK ergonomics are different.
- **Buyer familiarity** — Vercel is the default mental model for "ship a Next.js app." Cloudflare is "infrastructure for the brave." The buyer's "Deploy to Vercel" button is a known affordance; Cloudflare Pages has no equivalent template-deploy UX.

**Verdict:** Cloudflare is the right choice for the *control plane* (admin dashboard, JWT signing, internal APIs) — the operator's infra, not the tenant's. It's NOT a v0 alternative to Vercel for the per-tenant app. Re-evaluate at v2 if the Vercel cost line becomes dominant in the unit economics.

### 4.5 Alternative 4: Fly.io

Fly.io runs Next.js as a Docker container. Cost at 1,000 tenants: $5/mo per shared-cpu-1x 256MB machine = $5,000/mo. That's comparable to Vercel's $42K/mo for compute (much cheaper) but you lose the Vercel-specific primitives (Fluid Compute, OIDC, fluid optimized concurrency).

**Verdict:** Cheaper for compute, but lacks the Vercel platform primitives (per-tenant OIDC for JWT-binding, per-tenant observability, edge caching). Not a v0 candidate. Worth a v2 cost-comparison study.

### 4.6 Recommendation: keep "1 Vercel project per tenant"

The economic analysis (§4.1) shows 91-93% gross margin at 1,000 tenants. The alternatives either lose per-tenant isolation (multi-tenant Vercel, Cloudflare) or add operational complexity (SST, Fly) without a clear cost win at the v0 scale of 30-200 tenants. Vercel Platforms is the right primitive.

**Trigger to re-evaluate:** when Vercel cost exceeds 30% of the tenant MRR (i.e., $180/tenant on Team tier). At that point, Cloudflare Pages + Workers for the standard tier + Vercel for Enterprise becomes a viable split.

---

## 5. Operator workflow — spinning up N Vercel projects from one account

### 5.1 The happy path

The operator's control plane is a single Hono service running on Cloudflare Workers. The "create tenant" flow is:

1. **Stripe webhook fires** → control plane `POST /tenants` handler.
2. **Mint Turso DB** (parallel) → returns `turso_url`, `turso_token`. ~4s.
3. **Reserve Upstash namespace** (parallel) → returns prefix. ~2s.
4. **Mint Trigger.dev project** (parallel) → returns `trigger_project_ref`, `trigger_secret`. ~3s.
5. **Mint Vercel project** with all env vars pre-set → returns `vercel_project_id`. ~5s. **This is the critical step — the `DEESSEJS_SECRET` is already in `environmentVariables` on the create call.**
6. **Sign PASETO** with `{ vp: vercel_project_id, tg: turso_group_id, tu: trigger_project_ref, us: upstash_prefix, pl: plan, rg: region, ... }`. ~10ms.
7. **Re-call Vercel `PATCH /v9/projects/{id}` to set the just-signed `DEESSEJS_SECRET` in env** (the JWT was signed AFTER the project was created, so we need a second API call to set the secret). ~1s.
8. **Queue the Trigger.dev deploy job** (the operator's `POST /v13/deployments` to the operator's Trigger.dev project, which fans out to the tenant's Trigger.dev project). ~3s.
9. **Wait for the build to complete** (90-150s).
10. **Add custom domain** to the Vercel project via `POST /v10/projects/{id}/domains`. ~5s to enqueue, 30-120s for DNS + SSL.
11. **Send the buyer the welcome email** with the URL.

**Wall time for steps 1-11:** 90-150s for the build + 30-120s for domain SSL = 2-5 minutes. The feasibility doc's "4-6 min" is correct.

**Key change from feasibility:** the buyer no longer has to paste `DEESSEJS_SECRET` (it was set in step 5/7). The welcome email only needs to send the URL. The "Deploy to Vercel" button is removed.

### 5.2 Failure modes and mitigations

| Failure | Detection | Recovery | Impact on provisioning wall time |
|---|---|---|---|
| Vercel API token expired | `401 Unauthorized` from `POST /v11/projects` | Rotate the Vercel access token (the operator has a token-rotation script). Re-run the create. | +5s (re-run) |
| Turso DB create fails | `5xx` from Turso | Retry with exponential backoff (3 attempts, 2s/4s/8s). | +6-14s |
| Upstash Redis namespace reservation fails | `5xx` from Upstash | Retry. The "namespace" is just a prefix in a shared DB; failure is rare. | +2-4s |
| Trigger.dev project create fails | `5xx` from Trigger.dev | Retry. | +3-6s |
| **Vercel build queue full** | Deployment stuck in `QUEUED` state for > 5 min | **This is the #1 throttle.** Mitigations: (a) project-level on-demand concurrency at >100 tenants/mo, (b) defer the deploy and queue a `Build Hook` to fire later, (c) graduate to Vercel Enterprise at >200 tenants/mo. | **+0 to +60 min** (if deferred) |
| **Vercel build fails** | Deployment status `ERROR` | Inspect build log via `GET /v13/deployments/{id}`. Common causes: (a) OOM on the build machine, (b) `pnpm install` failure (mirror it), (c) TypeScript error. Retry with `vercel redeploy`. | +60-120s (rebuild) |
| **Custom domain SSL delay** | Domain status `Pending` for > 5 min | Vercel normally provisions SSL in 30-120s. If delayed, verify DNS with `dig CNAME <subdomain>`. Vercel retries SSL automatically. | **+0 to +24h** (worst case) |
| **Env var race** | Boot fails with "DEESSEJS_SECRET not set" | This happens if the operator's Trigger.dev deploy runs before step 7 (env var PATCH) completes. Fix: in the deploy job, `await` the env var PATCH (poll the project env via `GET /v9/projects/{id}/env` until `DEESSEJS_SECRET` is present). | +5-30s |
| **OIDC token mismatch** | Boot's `x-vercel-project-id` check fails | Check that the OIDC token's `project_id` claim matches `vp` in the JWT. The Vercel OIDC `issuerMode: team` is supposed to bind this; if not, re-set `oidcTokenConfig.issuerMode: "team"` via PATCH. | +30-60s |
| **Region mismatch** | Function execution timeouts in non-default region | The `serverlessFunctionRegion` parameter is set on create, but function-level region overrides take precedence. Verify via `GET /v1/projects/{id}` that `resourceConfig.functionDefaultRegions` matches the JWT's `rg` claim. | +30-60s |
| **Vercel rate limit hit** | `429 Too Many Requests` on env var PATCH (limit 120/min) | Back off and retry. At <100 tenants/mo, the rate limit is not hit. At >200 tenants/mo, batch the env var operations. | +60s |

### 5.3 The "token expired" risk

The operator's Vercel access token has the team's full read/write scope. If it leaks, the attacker can mint, modify, or delete any tenant. The token is stored in Cloudflare Workers Secrets (encrypted at rest) and in 1Password for backup. **Vercel access tokens do not have a built-in expiry** — they're long-lived until revoked.

**Mitigation:** Vercel Enterprise supports short-lived tokens (1-hour expiry via OAuth). On Pro, the operator should:
- Use the Vercel REST API token only from Cloudflare Workers (not from any developer laptop).
- Rotate the token every 90 days (manual; set a calendar reminder).
- Bind the token to the minimum scope: `Deployments: Write`, `Projects: Write`, `Domains: Write`, `Env Vars: Write`, `Build Hooks: Write`. Read-only is not needed (the operator owns the data).
- Audit via the Vercel Audit Log API (`GET /v1/teams/{id}/audit-log`).

### 5.4 Vercel rate limits that bite at scale

Per the Vercel Limits page, key API rate limits:

| Endpoint | Limit | Impact on Cloud |
|---|---|---|
| `POST /v9/projects/{id}/env` (env var create) | 120/min | At 100 tenants/mo creating in burst, OK. At 1,000 tenants/mo with batched updates, may need to back off. |
| `POST /v10/projects/{id}/domains` (domain add) | 120/hr | At 1,000 tenants/day with one domain each, OK. |
| `POST /v1/integrations/deploy-hooks/{id}` (fan-out updates) | 60/hr | **At a Cloud template update push to 1,000 tenants, only 60 fans out per hour.** This is the **update fan-out throttle.** Solution: stagger the fan-out over 17 hours, or use the Bulk Update API if available. |
| `POST /v13/deployments` (create deployment) | 500/min (user) or 120/5min (project) | The per-project 120/5min is the binding constraint — at 1,000 tenants with 1 deploy each, 24/min, OK. |
| `GET /v9/projects` (list projects) | 500/min | OK |

**The deploy-hooks fan-out throttle is a hidden cliff.** A single Cloud template update for 1,000 tenants hits the 60/hr limit, and the update queue grows unbounded. The operator must implement a rate-limited fan-out worker.

### 5.5 Operator admin dashboard (the "Platforms" affordance)

The feasibility doc mentions `app.deessejs.com` for the operator. The Vercel "Platforms" pattern is: the operator's Vercel team account holds all N tenant projects, and the operator uses Vercel's RBAC + Audit Log + Project API to manage them.

Per the Vercel RBAC page, team roles include `Owner`, `Member`, `Developer`, `Billing`, `Viewer`. For the Cloud operator:
- `Owner` (1-2 humans) — full control, can transfer ownership.
- `Developer` (operators) — can create/modify projects, deploy, manage env.
- `Viewer` (read-only) — for the support team.

For a future Agency tier where the buyer has dashboard access, the operator would need to invite the buyer as a `Viewer` to their project specifically (not to the whole team). The feasibility doc's Agency tier is a v2 concern.

---

## 6. Synthesis for the tech report

### 6.1 Confirmations of the feasibility doc

- "1 Vercel project per tenant" is the right primitive. Confirmed by the analysis in §4.
- 12-concurrent-builds ceiling is the #1 onboarding throttle. Confirmed, with a refined mitigation path (§2.1).
- Vercel Platforms (multi-project per team) is the right control plane pattern. Confirmed.
- Vercel OIDC for JWT-binding (`oidcTokenConfig.issuerMode: team`) is the standard escape-hatch design. Confirmed.
- The 365-day JWT expiry is reasonable. Not changed.

### 6.2 Corrections to the feasibility doc

- **Risk #5 (300s ceiling) is OBSOLETE.** Updated to 800s GA / 1800s beta with Fluid Compute. Recommendation unchanged (Trigger.dev for long jobs, Vercel Functions for short).
- **POST /v1/projects → POST /v11/projects.** Implementation must use the current API version.
- **Step 8 (buyer pastes DEESSEJS_SECRET) is REMOVED.** Set the env var on project create instead. Better UX, same security.
- **The 120s proxied request timeout** is a separate, more constraining ceiling than the 1800s function limit. The 4.9 architecture (Trigger.dev + Upstash Realtime) is still required.
- **Deploy hook fan-out is throttled at 60/hr.** Add a rate-limited fan-out worker for Cloud template updates.

### 6.3 Open questions for the synthesis agent

1. **Token rotation cadence** — manual 90 days vs. automated 30 days? Recommend manual 90 days for v0 (operator team of 1-2), automated 30 days for v1.
2. **Build machine type per tenant** — Standard for all vs. Enhanced for AI-heavy tenants? Recommend Standard for v0; revisit when AI-heavy tenant data lands.
3. **Update fan-out strategy** — staggered batches of 12 (matches build concurrency) vs. on-demand concurrent builds (bypasses queue, $0.028/tenant/mo)? Recommend staggered batches for v0; on-demand for v1.
4. **SST adoption for the operator's own infra** — Worth the operational complexity in v1, or stay on Cloudflare Workers + Vercel? Recommend Cloudflare Workers for v0 (simpler); SST for v1 if multi-cloud is needed.
5. **Vercel Enterprise trigger threshold** — 200 tenants / $20K MRR (feasibility doc) is the right line. Confirm with the synthesis agent's pricing model.

---

## 7. Sources

- Vercel REST API — Projects > Create a new project. https://vercel.com/docs/rest-api/reference/endpoints/projects/create-a-new-project
- Vercel REST API — Projects > endpoints list. https://vercel.com/docs/rest-api/reference/endpoints/projects
- Vercel Limits. https://vercel.com/docs/limits (last updated 2026-05-20)
- Vercel Pricing. https://vercel.com/docs/pricing (last updated 2026-05-28)
- Vercel Runtimes. https://vercel.com/docs/functions/runtimes (last updated 2026-06-02)
- Vercel Fluid Compute. https://vercel.com/docs/fluid-compute (last updated 2026-05-14)
- Vercel Function usage-and-pricing. https://vercel.com/docs/functions/usage-and-pricing (last updated 2026-03-19)
- Vercel Managing Builds. https://vercel.com/docs/builds/managing-builds (last updated 2026-04-30)
- Vercel Deployment Protection. https://vercel.com/docs/deployment-protection (last updated 2026-05-14)
- Vercel Projects overview. https://vercel.com/docs/projects (last updated 2026-02-26)
- Vercel Domains overview. https://vercel.com/docs/domains (last updated 2026-02-17)
- Vercel Adding a Custom Domain. https://vercel.com/docs/domains/working-with-domains/add-a-domain (last updated 2026-02-27)
- Vercel Changelog 2026-06-15 — Functions can now run up to 30 minutes. https://vercel.com/changelog/vercel-functions-can-now-run-up-to-30-minutes
- Vercel Configuring a Build. https://vercel.com/docs/builds/configure-a-build (last updated 2026-03-17)
- SST documentation. https://sst.dev/docs/
- Fly.io Pricing. https://fly.io/docs/about/pricing/
