# B3 — DEESSEJS_SECRET Lifecycle

> **Author:** B3 research agent
> **Date:** 2026-06-18
> **Feeds into:** `tech-2026-06.md` (synthesis agent)
> **Corrects:** Risk #5 of feasibility doc (300s ceiling) is now obsolete — Vercel Functions can run up to 1800s on Pro/Enterprise (Node.js, Python) with Fluid Compute + `maxDuration=1800`. This does NOT change the B3 secret design, but it does mean long-running agent jobs no longer have to be queued via Trigger.dev if they live on the Vercel Function path — the 4.9 streaming architecture can be simplified. The DEESSEJS_SECRET design below is independent of the 4.9 decision.

---

## 1. The seven design dimensions

The feasibility doc treated `DEESSEJS_SECRET` as a single line: "JWT with Vercel project ID binding, 365-day expiry, server-side check via `x-vercel-project-id` header." That is the public-facing contract. The internal design has to answer seven questions before the JWT can be signed.

### 1.1 Mint

**Who mints.** The control plane Edge function at `app.deessejs.com` (a single Hono route handler behind Cloudflare Access). The trigger is the Stripe `checkout.session.completed` webhook firing `POST /tenants` against the control plane. The control plane is the only entity that holds the signing key. No human runs the mint; no Vercel build-time hook signs the JWT.

**When.** Step 6 of the 12-step provisioning flow — after the Turso DB is reachable, the Upstash namespace is reserved, and the Trigger.dev project exists (the JWT claims bind to all three IDs and are useless if minted before the IDs exist). The JWT is minted before the operator-side Trigger.dev job deploys the tenant's first build, and well before the buyer clicks "Deploy to Vercel."

**What claims.** The current feasibility claim set is too wide — putting `turso_url` and `turso_token` *inside* a signed-but-not-encrypted JWT means the JWT IS the credential, and anyone who exfiltrates the token gets the database. The corrected claim set:

| Claim | Type | Why |
|---|---|---|
| `iss` | `deessejs-cloud` | Issuer pin |
| `aud` | `<tenant_id>` | Audience pin (rejects cross-tenant token replay) |
| `sub` | `<tenant_id>` | Subject |
| `iat` | unix seconds | Issued at |
| `nbf` | unix seconds | Not before (set to `iat`) |
| `exp` | unix seconds | Expiry (default `iat + 365d`, see §1.4) |
| `jti` | ULID | Unique token id (revocation key, see §1.5) |
| `vp` | `<vercel_project_id>` | Vercel project binding (replay defense — checked against `process.env.VERCEL_PROJECT_ID` server-side) |
| `tg` | `<turso_group_id>` | Turso group reference (NOT the DB URL — that is looked up at boot) |
| `tu` | `<trigger_project_ref>` | Trigger.dev project ref (NOT the secret — that is looked up at boot) |
| `us` | `<upstash_namespace_prefix>` | Upstash shared-DB namespace prefix (e.g. `t:t_abc123:`) |
| `pl` | `starter` / `team` / `studio` / `enterprise` | Plan tier (used for rate limit and feature gating) |
| `rg` | `iad1` / `fra1` etc. | Region pin (cross-region replay defense) |
| `ver` | `1` | Schema version (lets us break claims later) |

The control plane does NOT put the actual Turso URL, the actual Turso auth token, the actual Upstash REST token, or the actual Trigger.dev secret in the JWT. The JWT is an *envelope* — at first boot the tenant app calls `POST /exchange` against the control plane with the JWT, and the control plane responds with a short-lived (15-minute) **resolved-credentials bundle**. The boot writes the bundle to a per-process LRU cache and `/tmp/.deessejs-resolved.json` per the feasibility doc. The boot exchange is over the same HTTPS path Vercel uses; the control plane verifies the JWT, checks `vp` matches the Vercel project id embedded in the calling request's OIDC token, and returns credentials in a `PASERK seal` blob (see §1.7).

**Signing algorithm.** **EdDSA (Ed25519) over PASETO v4.public, not JWT RS256.** Three reasons:

1. **EdDSA is a single fixed algorithm.** The `alg` confusion attack class (CVE-2015-2951: HS256 forged with the public key, the classic `alg: none` attack) is structurally impossible because PASETO v4 has no `alg` field. JWT's `alg` is a string the verifier has to dispatch on; PASETO v4's `purpose` is a fixed enum (`local` for AEAD, `public` for signature).
2. **Ed25519 keys are 32 bytes raw / 64 bytes PEM-encoded.** The operator's signing keypair fits in a single Cloudflare Workers secret binding. RS256 keys are 2048+ bits; the same Cloudflare binding cap applies but the public-key fetches in the verifier are heavier.
3. **PASERK `lid` (local ID) and `pid` (public ID) are 32-byte fingerprints of the key, derived independently of the key material.** The control plane can store the `pid` in the database as the "which key signed this token" pointer and the JWT carries the `kid` as the footer `pid`. A control-plane DB leak therefore exposes `pid` values, not the actual public key. This is a defense-in-depth property JWT/JWK lacks (a JWK embeds the public key).

**Key custody.** The control plane runs on Cloudflare Workers (Edge runtime). The Ed25519 signing keypair is generated once on a HSM-backed operator laptop, the **secret** key is uploaded to Cloudflare Workers Secrets (encrypted at rest with Cloudflare's KMS), and the **public** key is written to a single-row `control_plane_signing_key` table in the control-plane's own Turso DB. Rotating the key is a two-step process: generate the new keypair, upload the new secret to Workers, append the new public key to the table with `active_from` and `active_to` timestamps. Tokens issued during the overlap window carry the `pid` footer that points to the right public key.

A second, less-trusted copy of the secret key lives in 1Password (operator team) and AWS KMS (cross-cloud backup, encrypted envelope). HSM-grade custody (Cloudflare HSM-backed key) is a v2 upgrade once the operator moves to Vercel Enterprise plan and clears SOC2.

### 1.2 Distribution

**Email is the wrong primary channel.** The feasibility doc's "post-purchase email with Deploy to Vercel button" is fine for the happy path, but loses to:
- **Spam folder misclassification** — Stripe receipts go to spam, Resend transactional emails also misclassify ~5% of the time.
- **Mailbox churn** — founder changes email addresses, the address on the Stripe customer is now wrong.
- **Forwarding leaks** — emails are forwarded to Gmail, ProtonMail, Notion, Linear inboxes; any of those is a higher-trust-but-lower-control surface than the customer account.
- **No recovery flow** — the feasibility doc does not specify what happens when the buyer says "I lost the email."

**Recommended distribution channels, in order of preference:**

1. **Operator dashboard at `app.deessejs.com` (primary).** The buyer logs in with Better Auth (magic link or Google), sees their `DEESSEJS_SECRET` with a copy-to-clipboard button and a "Reveal" click. The dashboard is the canonical source — every secret can be re-issued from here, and the operator admin can see "when was this secret last viewed."
2. **Buyer email (secondary, on the happy path).** A Resend-templated email with a single "View Secret" button that hits a signed URL on the operator dashboard (`?token=<short-lived JWT>`). The short-lived token expires in 60 minutes, is single-use, and the email body never contains the raw secret.
3. **CLI (third channel, for power users).** `npx deessejs-cli claim` walks the buyer through a device-code OAuth flow against the operator dashboard, exchanges a device code for the secret, and writes it to `~/.deessejs/credentials.json` with `chmod 600`. This is the channel that agencies and power users want — they can script the deploy.
4. **Vercel env-var injection (fourth channel, the v2 bet).** See §1.7 and the C1 "skip-the-paste" task — the control plane can push the secret directly into the Vercel project env vars after the buyer authorizes the operator's Vercel app via OAuth. The buyer then never has to paste anything. v0 ships with channel 2 (email) and channel 1 (dashboard); channels 3 and 4 are v1.

**Recovery flow.** The buyer loses access to email and the dashboard login. Recovery is the standard Better Auth flow — password reset, magic link, Google re-auth, plus operator-side manual override gated by Cloudflare Access for the operator team. The operator admin dashboard has a "Re-issue Secret" button that revokes the current `DEESSEJS_SECRET` (see §1.5) and emails a fresh one. **Recovery is always paired with revocation** — the old secret stops working the instant the new one is issued, so the recovered buyer cannot be re-compromised by whoever had the old email.

### 1.3 Storage (and the control-plane-DB leak)

**The threat the feasibility doc under-specifies.** "No raw credentials in control plane DB" is correct for the *first* credential layer (Turso tokens, Upstash tokens, Trigger.dev secrets) — those live only in the control plane's Cloudflare Workers Secrets bindings and are never written to a database. **But the feasibility doc puts the per-tenant Turso URL and Turso auth token inside the JWT, and the JWT itself is what the buyer pastes.** A leaked DEESSEJS_SECRET equals leaked Turso credentials equals read/write access to the tenant's database.

**The full attack surface of a control-plane DB leak under the feasibility doc's design:**

- Row `tenants(tenant_id, stripe_customer_id, vercel_project_id, plan, status, ...)` — visible. Fine.
- Row `tenant_secrets(jti, jwt_blob_encrypted, created_at, revoked_at)` — even if the JWT is encrypted at rest, the encryption key sits in the same Cloudflare Workers Secrets binding, so a control-plane compromise decrypts all rows.
- Row `service_credentials(tenant_id, service, credential)` — IF the design puts raw Turso/Upstash/Trigger.dev credentials here, **a control-plane DB leak = full tenant compromise for all tenants in one read**.

**Defense in depth: encrypt what the JWT itself can leak.** Two layers:

1. **Don't put raw credentials in the JWT claims.** The corrected claim set in §1.1 stores only IDs and refs, not secrets. The first-boot exchange (`POST /exchange`) is what returns the actual `turso_url` and `turso_token`, and that exchange is over HTTPS to the control plane. The control plane authorizes the exchange by verifying the JWT, then returns a **PASERK `seal` blob** — the bundle is wrapped using the tenant's own Ed25519 public key (rotated alongside the JWT signing key), so only the holder of the tenant's private key (which never leaves the Vercel project's env vars) can unwrap the bundle. A control-plane DB leak without the corresponding private key is useless.
2. **Encrypt the JWT itself at rest in the control plane DB.** Use AES-256-GCM with a key bound to the operator's KMS. The encryption key is a Cloudflare Workers Secret; it never appears in the DB. A DB-only leak (e.g. a backup file, a SQL injection, a leaked replica) is then opaque ciphertext, not tokens.

**Combined: a control-plane DB leak without a Cloudflare Workers Secrets leak yields ciphertext that the operator cannot read.** A full control-plane compromise (DB + Workers Secrets) is what unlocks everything, and that is a single, monitorable blast radius (one Cloudflare account, one Workers project, audit-logged at the Workers level).

### 1.4 Rotation

**Annual forced rotation is too coarse for production.** 365-day expiry means a leaked `DEESSEJS_SECRET` is good for up to 365 days, with no opt-in shortening. The compromise is two-tier:

1. **Default 90-day expiry**, not 365. The operator's internal cron (`@deessejs-cloud/secret-rotation`) runs 30 days before expiry, signs a fresh JWT, emails the buyer (channel 2), and writes the new `jti` to the control plane's `tenant_secrets` table. The buyer must rotate the Vercel env var themselves (or click through the email link that opens the dashboard with the new secret pre-filled and a "Push to Vercel" button using the Vercel OAuth grant).
2. **24-hour rolling grace period** for the expired JWT. During the 24 hours after expiry, the Vercel Function still boots but logs a `WARN` event to the operator admin dashboard ("tenant X secret expired at <ts>, awaiting rotation"). After 24 hours, boots fail. This is the "we know rotation is overdue" tripwire.

**Incident-driven rotation.** When the operator or buyer suspects compromise, the admin dashboard "Re-issue Secret" button (also the recovery action in §1.2) revokes the current `jti` and signs a new one with a fresh 90-day window. The full rotation is one click. The buyer must push the new value to Vercel within the next 24 hours (same 24h grace, same warning logs).

**Why not shorter (e.g. 7-day)?** The 90-day window balances two failure modes:
- Too short: every 7 days the buyer has to touch the env var. Operator's support load multiplies. Resend's email-template system is not designed to be a credential-rotation channel.
- Too long: a leak is good for the whole window. 90 days is the same window as a typical TLS certificate and the same window as a typical OAuth refresh-token expiry. It's not perfect; it is industry-standard.

**Why not longer (e.g. 365)?** The feasibility doc's 365 is the SaaS-template-industry default (Supabase and Vercel both use 1-year tokens for "Deploy to Vercel" buttons), but those are bearer tokens for the *first* deploy only — the tenant app generates its own long-lived session after. Cloud's DEESSEJS_SECRET is not a one-shot deploy token; it is the *permanent* credential. 90 days is the right order of magnitude for a long-lived, human-distributed credential.

### 1.5 Revocation

**Self-contained JWTs are offline-verifiable by design.** Verification is: check signature, check `exp`, check `nbf`, check `aud`, check `audience`'s `vp` matches `process.env.VERCEL_PROJECT_ID`. None of these checks require a network call. That's the upside (low-latency, low-cost) and the downside (no revocation primitive).

**The revocation list.** A single Turso table `revoked_jti(jti TEXT PRIMARY KEY, revoked_at INTEGER, reason TEXT, expires_at INTEGER)`. On every boot, the `/api/internal/boot` handler checks the `jti` against the local LRU cache first, then against Upstash (read-through cache, populated by the control plane's webhook into the tenant's Upstash namespace on revoke), then against the control plane's `/revocation-list?since=<last_check_ts>` endpoint. Three-tier check, each tier cached:
- LRU cache: instant, 0ms.
- Upstash `GET revoked:<jti>`: ~5ms, 99% of the time this is the only check needed.
- Control plane: 50-200ms, only on boot and only if Upstash says "not revoked."

**Propagation latency.** Upstash global replication is sub-100ms. A revoke on the control plane fires a webhook into the tenant's Upstash namespace (`SET revoked:<jti> 1 EX 7776000`) and the next request within ~1s will see the revocation. The control plane's own `revoked_jti` table is the source of truth; Upstash is a cache. **At-least-once delivery via a durable queue** (Cloudflare Queues, $0.40 per million operations) ensures the webhook is not lost. The control plane's `/revocation-list?since=` endpoint lets a tenant backfill on cold boot (the Upstash cache might be empty for a new instance).

**Graceful failure mode.** If the control plane is unreachable and Upstash is reachable: the boot proceeds, the revocation check is "best effort," and a single WARN log is emitted. If both are unreachable: the boot fails (fail-closed) and the operator is paged. The fail-closed mode is the only safe choice — a tenant app that boots without being able to check revocation is a tenant app that cannot tell a leaked token from a valid one.

**Why not a token introspection endpoint (OAuth 2.0 RFC 7662 style)?** Three reasons:
1. Every boot adds 50-200ms of control-plane latency. The whole point of self-contained JWTs is sub-millisecond verification.
2. The control plane becomes a hard dependency on the tenant's request path. A 5-minute Cloudflare outage takes down every tenant.
3. The upstash cache + revocation table gives 99% of the safety of introspection with 1% of the dependency. Introspection is the right *fallback* (cold boot, cached miss) but not the default.

### 1.6 Blast radius of a single leak

**Under the feasibility doc's design, a leaked DEESSEJS_SECRET IS a full tenant compromise.** The token contains the Turso URL and the Turso auth token. Anyone with the token can read, write, and delete the tenant's database. There is no defense-in-depth.

**The corrected design collapses the blast radius three ways:**

1. **The JWT does not contain service credentials.** It contains only IDs and refs. A leaked JWT lets an attacker call `POST /exchange` against the control plane — which still requires a valid Vercel project context (Vercel's OIDC token in the request). An attacker can call `/exchange`, but only from a request originating from a Vercel Function (Vercel's OIDC token is unforgeable). This means **a leaked JWT alone, without access to the Vercel project's runtime, cannot exchange for the resolved-credentials bundle.**
2. **The exchange response is a PASERK seal wrapped to the tenant's Ed25519 public key.** Even if an attacker gets the exchange response, they cannot unwrap it without the tenant's private key. The private key lives in Vercel env vars, encrypted at rest by Vercel, and is fetched at boot via the standard Vercel runtime env API. An attacker needs both (a) the JWT and (b) code execution inside the Vercel Function to be able to unwrap and use the bundle.
3. **Per-service least-privilege tokens.** The bundle that comes back from `/exchange` is a set of scoped tokens:
   - Turso: read-only token for read paths (`SELECT`), full-access token for write paths (`INSERT`, `UPDATE`, `DELETE`). Read paths use the read-only token; the full-access token is only loaded into the write-path code path. The feasibility doc's "Upstash read-only token for read paths" hint is correct in spirit but the *Turso* token is the bigger leak — the read-only vs. full-access split should apply to *all* services, not just Upstash.
   - Upstash: read-only token for read paths (Realtime subscription, Ratelimit read).
   - Trigger.dev: scoped to a `dev` / `prod` environment, scoped to specific tasks (no `*`).
   - Resend: API key restricted to the tenant's sender domain only.
   - Stripe: never stored in the bundle — Stripe Connect Standard means the buyer's own connected account owns the Stripe key, and the operator never holds it. The feasibility doc's "Stripe Connect Standard" choice is the most important blast-radius reduction in the whole design — a Cloud compromise does not leak any buyer's payment processor.

**The remaining attack surface:** a leaked JWT, stolen from a buyer's email, is enough to call `/exchange` IF the attacker can also make a request that has a valid Vercel OIDC token. That requires either (a) code execution inside the Vercel Function, (b) a Vercel-side compromise, or (c) a man-in-the-middle on the Vercel → control plane path (mitigated by TLS pinning). The buyer is protected by the fact that simply reading the email is not enough.

**The defense-in-depth backup: Turso row-level security and Upstash read-only tokens for read paths** are the *last* line of defense if everything else fails. If a leaked JWT leads to a leaked read-only Turso token, the attacker can read the database but cannot write or delete.

### 1.7 Alternatives

| Option | Mint | Distribution | Storage / DB leak | Rotation | Revocation | Blast radius | Verdict |
|---|---|---|---|---|---|---|---|
| **JWT + RS256 (feasibility doc)** | Stripe webhook → Edge fn signs | Email + dashboard | JWT *contains* Turso URL+token → DB leak = full tenant compromise | Annual forced only | None (offline-verifiable) | Full tenant compromise on leak | REJECTED |
| **PASETO v4.public + sealed exchange (this design)** | Stripe webhook → Edge fn signs PASETO v4 | Dashboard primary, email secondary, CLI tertiary, Vercel-OAuth v2 | JWT contains only IDs, exchange returns PASERK seal to tenant's pubkey | 90-day + incident | Turso table + Upstash cache + Queues | Need both JWT and Vercel runtime to unwrap bundle | **RECOMMENDED** |
| **HashiCorp Vault** | Vault operator issues dynamic Turso/Upstash/Trigger.dev tokens on a lease | n/a (token is fetched at boot) | Vault audit log + dynamic leases | Lease TTL (configurable, default 32d) | Vault lease revoke → token dead in seconds | Dynamic token per request = minimal blast radius | **REJECTED for v0** (operational cost: Vault HA cluster is $1k+/mo on HCP, + dedicated DevOps to run self-hosted). Revisit at 500+ tenants if compliance demands it. |
| **AWS Secrets Manager** | Lambda rotation function | n/a | KMS-encrypted at rest | Automatic rotation via Lambda | Delete secret → ~immediate | Per-secret KMS grants, fine-grained IAM | **REJECTED for v0** (operational cost: AWS account + per-secret pricing + Lambda rotation logic; no benefit over PASETO+v4 for this use case). Worth keeping as the v2 "Enterprise single-tenant dedicated AWS" option. |
| **BFF pattern with per-request exchange** | Same as PASETO design | Same | Same | Same | Same | Per-request exchange, tokens never cached in tenant memory | **REJECTED for v0** (every request adds 50-200ms control-plane latency, breaks the "Edge runtime = fast" promise, doubles the Lambda invocation cost). Worth keeping as the v2 Enterprise option for security-sensitive buyers (HIPAA). |
| **PASETO v4.local (encrypted, not signed)** | Stripe webhook → Edge fn encrypts | Same | Encrypted at rest is the default | Same | Same | Cannot be verified offline (need decryption key) | **REJECTED** (loses the offline-verification property, no upside over sealed exchange) |

---

## 2. Recommended lifecycle

```
                                                                 
   Stripe webhook      /tenants       mint PASETO v4.public      
   ───────────────────►  ────────────►  ───────────────────────────┐
                                                                 │  §1.1
                                                                 ▼
   Ed25519 keypair in Cloudflare Workers Secrets (active + previous)
   Public key(s) in control-plane Turso `control_plane_signing_key` table
                                                                 
   EdDSA-signed PASETO v4.public token                      
   claims = { iss, aud, sub, iat, nbf, exp, jti,             
              vp, tg, tu, us, pl, rg, ver }                   
   footer = { kid: <pid of active signing key> }              
                                                                 
   ──────────────────────────────────────────────┐              
                                                 │  §1.2        
                                                 ▼              
   Distribution: dashboard primary, email secondary, CLI tertiary
   Recovery = revocation + re-issue, never just re-issue
                                                                 
   ──────────────────────────────────────────────┐              
                                                 │  §1.3        
                                                 ▼              
   Tenant app boot:                                             
   1. Verify PASETO signature with kid-pinned public key (offline, <1ms)
   2. Verify aud == tenant_id, vp == VERCEL_PROJECT_ID, exp/nbf
   3. Check jti: LRU → Upstash → control plane /revocation-list
   4. POST /exchange with Vercel OIDC token + PASETO in Authorization
   5. Control plane verifies PASETO + Vercel OIDC sub matches vp
   6. Returns PASERK seal blob: per-service scoped tokens
      - turso_ro, turso_rw (separate)
      - upstash_ro
      - trigger_dev (env-scoped, task-scoped)
      - resend (domain-scoped)
      - stripe is NOT in the bundle (Connect Standard, buyer's own)
   7. Tenant app unwraps with own private key (in Vercel env)
   8. Caches to LRU + /tmp/.deessejs-resolved.json (15-min TTL)
                                                                 
   ──────────────────────────────────────────────┐              
                                                 │  §1.4        
                                                 ▼              
   Rotation:                                                      
   - Default 90-day expiry, 24h grace period with WARN logs
   - Operator cron signs fresh token 30 days before expiry
   - Resend email with dashboard deep-link (60-min signed URL)
   - Buyer re-pastes (v0) or clicks "Push to Vercel" (v1, OAuth)
   - Incident rotation = admin dashboard "Re-issue Secret" button
   - Old jti immediately written to revoked_jti table
                                                                 
   ──────────────────────────────────────────────┐              
                                                 │  §1.5        
                                                 ▼              
   Revocation:                                                    
   - Source of truth: control-plane Turso `revoked_jti`
   - Cache: tenant Upstash namespace `revoked:<jti>` (EX 90d)
   - Webhook fan-out via Cloudflare Queues (durable, at-least-once)
   - On boot: LRU → Upstash → /revocation-list?since= (cold boot)
   - Fail-closed: if neither Upstash nor control plane is reachable, refuse to boot
                                                                 
```

---

## 3. Concrete artifacts this design produces

1. **Two PASETO v4.public libraries** — `@deessejs-cloud/paseto-sign` (control plane, uses `crypto.sign` with Ed25519) and `@deessejs-cloud/paseto-verify` (tenant app, uses `crypto.verify` with the pinned public key).
2. **Three env vars on the tenant app** — `DEESSEJS_SECRET` (the PASETO), `DEESSEJS_PRIVATE_KEY` (Ed25519, for unwrapping the seal blob), and the existing `VERCEL_PROJECT_ID` (Vercel system env, no setup).
3. **One endpoint on the control plane** — `POST /exchange` (auth: `Authorization: Bearer <paseto>` + Vercel OIDC token in body), returns the seal blob.
4. **One endpoint on the control plane** — `GET /revocation-list?since=<ts>` (auth: Vercel OIDC token, returns revoked JTIs since ts).
5. **Two Cloudflare Workers Secrets** — `DEESSEJS_CP_SIGNING_KEY` (Ed25519 secret) and `DEESSEJS_CP_DB_ENCRYPTION_KEY` (AES-256-GCM, for the `tenant_secrets.jwt_blob_encrypted` column).
6. **One Turso table** — `revoked_jti(jti TEXT PRIMARY KEY, revoked_at INTEGER, reason TEXT, expires_at INTEGER)` on the control plane.
7. **One Cloudflare Queue** — `revoke-fanout` consumer, with a worker that calls `SET revoked:<jti> 1 EX 7776000` against each tenant's Upstash.
8. **One operator cron** — `@deessejs-cloud/secret-rotation`, runs daily, finds tenants with `exp - now < 30 days`, signs fresh token, sends email via Resend.
9. **One admin dashboard action** — "Re-issue Secret" on `app.deessejs.com/tenants/<id>`, gated by Cloudflare Access, fires the revoke webhook + signs the new token + emails the buyer.

---

## 4. Open questions for synthesis

1. **Should the operator also sign a per-tenant Ed25519 keypair at mint time and inject `DEESSEJS_PRIVATE_KEY` into the Vercel project env via the Vercel API (not the buyer paste)?** This collapses the "buyer must paste two env vars" UX. Requires a Vercel API token with write access to the project env vars, which the operator holds at mint time. **Recommended for v1** (post-v0), makes v0 simpler.
2. **Should the Upstash namespace own the revocation cache, or should we use a dedicated Upstash DB just for revocations?** A dedicated DB is more blast-radius-isolated (a tenant's Upstash data plane compromise cannot poison the revocation cache) but adds an Upstash DB per region. **Recommended: shared `deessejs-cloud-revocations` Upstash DB for v0**, migrate to per-region at 100+ tenants.
3. **What is the fail-closed behavior during a 24h+ control-plane outage?** The fail-closed mode means every tenant's boot fails. Should there be a "break glass" operator-controlled override (e.g. a 4-hour signed JWT that any tenant can boot with) for catastrophic incidents? **Recommended: yes, but the break-glass token is itself short-lived (4h) and requires a second operator to co-sign.**
4. **Do we need a `vp` (Vercel project ID) check at boot, or is the Vercel OIDC token enough?** The feasibility doc binds via `x-vercel-project-id` header. The Vercel OIDC token already contains the project ID (in the `project` claim). The `vp` check is redundant if OIDC is verified. **Recommended: keep the `vp` check as a defense-in-depth — OIDC verification uses Vercel's JWKS (network call), `vp` check is local.**
5. **Should the control plane issue PASETO v4.public with the `lid` (local ID) in the footer, not the `pid`?** PASETO spec says `lid` is for `local` purpose, `pid` is for `public` purpose. We use `public` purpose, so `pid` is correct. **Verified correct, no change.**

---

## 5. Corrected risk register entry

The feasibility doc's Risk #4 (DEESSEJS_SECRET single high-value credential) is partially mitigated by the design above, but a stronger version is:

> **Risk #4 (revised):** `DEESSEJS_SECRET` is the credential that gates the first-boot exchange. A leaked DEESSEJS_SECRET without access to the Vercel runtime cannot unwrap the resolved-credentials bundle (PASERK seal bound to the tenant's Ed25519 pubkey), so the JWT itself is not the credential. The full compromise requires (a) the DEESSEJS_SECRET and (b) code execution inside the Vercel Function. **Mitigation:** 90-day expiry (not 365); revocation list with sub-1s Upstash cache propagation; PASERK-sealed exchange response; per-service least-privilege tokens; Vercel OIDC token required for exchange; fail-closed on revocation check; "Re-issue Secret" admin action with one-click revoke + re-issue. **Residual risk:** a Vercel-side compromise (Vercel's OIDC signing keys leaked) breaks the whole design. Out of scope for v0; v2 path is to introduce a per-tenant HMAC binding to the buyer-chosen passphrase (BFF upgrade).

The feasibility doc's Risk #5 (300s Vercel Function ceiling) is **OBSOLETE** as of 2026-06-15 — Vercel Functions can run up to 1800s (30 min) on Pro/Enterprise with Fluid Compute + `maxDuration=1800`. Source: <https://vercel.com/changelog/vercel-functions-can-now-run-up-to-30-minutes>. Long agent loops no longer have to be Trigger.dev jobs by default. The 4.9 streaming architecture is now a *choice*, not a constraint. The DEESSEJS_SECRET design is independent of the 4.9 decision.
