---
name: project-deessejs-secret-paseto
description: DEESSEJS_SECRET is PASETO v4.public (EdDSA/Ed25519), envelope-only — actual creds returned by control plane /exchange in 15-min PASERK seal
metadata:
  type: project
---

`DEESSEJS_SECRET` is **NOT a JWT**. It's a **PASETO v4.public token signed with Ed25519**. The decision is load-bearing — it removes the JWT `alg`-confusion attack class entirely. This memory captures the design so you don't re-litigate it in a new A/B/C doc.

## The 13 claims (envelope-only)

| Claim | Type | Why |
|---|---|---|
| `iss` | `deessejs-cloud` | Issuer pin |
| `aud` | `<tenant_id>` | Audience pin (rejects cross-tenant replay) |
| `sub` | `<tenant_id>` | Subject |
| `iat` | unix seconds | Issued at |
| `nbf` | unix seconds | Not before (= `iat`) |
| `exp` | unix seconds | Expiry (default `iat + 365d`) |
| `jti` | ULID | Unique token id (revocation key) |
| `vp` | `<vercel_project_id>` | Vercel project binding (server-side check vs `process.env.VERCEL_PROJECT_ID`) |
| `tg` | `<turso_group_id>` | Turso group reference — NOT the DB URL (looked up at boot) |
| `tu` | `<trigger_project_ref>` | Trigger.dev project ref — NOT the secret (looked up at boot) |
| `us` | `<upstash_namespace_prefix>` | Upstash shared-DB namespace prefix (e.g. `t:t_abc123:`) |
| `pl` | `starter` / `team` / `studio` / `enterprise` | Plan tier (rate limit + feature gating) |
| `rg` | `iad1` / `fra1` etc. | Region pin (cross-region replay defense) |
| `ver` | `1` | Schema version (lets us break claims later) |

**What is NOT in the JWT:** the actual Turso URL, the actual Turso auth token, the actual Upstash REST token, the actual Trigger.dev secret. The JWT is an envelope. The credentials are returned by `POST /exchange` against the control plane in a **PASERK `seal` blob with 15-minute TTL**.

## Why EdDSA (not RS256 / HS256 / ES256)

1. **PASETO v4 has no `alg` field.** The `alg: none` / `alg: HS256` confusion attack class (CVE-2015-2951 and successors) is **structurally impossible**. JWT's `alg` is a string the verifier has to dispatch on; PASETO v4's `purpose` is a fixed enum (`local` for AEAD, `public` for signature).
2. **Ed25519 keys are 32 bytes raw / 64 bytes PEM-encoded.** Fits in a single Cloudflare Workers secret binding. RS256 keys are 2048+ bits — heavier public-key fetches on every verify.
3. **PASERK `lid` (local ID) and `pid` (public ID) are 32-byte fingerprints** of the key, derived independently of the key material. The control plane can store the `pid` in the DB as the "which key signed this token" pointer and the JWT carries the `kid` as the footer `pid`. A control-plane DB leak exposes `pid` values, not the actual public key. JWT/JWK embeds the public key — no such defense.

## Key custody (v0)

- **Ed25519 keypair generated once on a HSM-backed operator laptop**
- **Secret key** → Cloudflare Workers Secrets (encrypted at rest with Cloudflare KMS)
- **Public key** → single-row `control_plane_signing_key` table in the control-plane's Turso DB
- **Rotation**: generate new keypair, upload new secret to Workers, append new public key to the table with `active_from`/`active_to`. Tokens issued during the overlap window carry the `pid` footer that points to the right public key.
- **Backup**: 1Password (operator team) + AWS KMS (cross-cloud, encrypted envelope)
- **v2 upgrade**: HSM-grade custody once operator moves to Vercel Enterprise + clears SOC2

## The 7 design dimensions (B3 §1 — don't skip any)

1. **Mint** — when, by whom, what claims, what algorithm, what key custody
2. **Distribution** — email is wrong; recommended channels in B3 §1.2
3. **Rotation** — see `PATCH /v9/projects/{id}` with new `environmentVariables[]` (30-60s rebuild per rotation)
4. **Revocation** — `jti` ULID is the revocation key; control plane maintains a denylist
5. **Expiry** — default 365 days
6. **Key custody** — see above
7. **Envelope encryption** — the resolved-credentials bundle from `POST /exchange` is sealed with PASERK

## How to handle proposals that touch this

- **"Use JWT instead"** — reject. The `alg` confusion class is the entire point.
- **"Use RS256 / ES256"** — accept only with a security review. Default is EdDSA.
- **"Put the Turso token in the JWT"** — reject. The JWT IS the credential.
- **"Rotate the secret every X days"** — confirm the rotation cost (30-60s rebuild × N tenants) is acceptable; v0 is 30 tenants so 1 rotation per ~12 days.
- **"Move to HSM in v0"** — reject; v0 is Cloudflare Workers Secrets. HSM is v2.

**How to apply:** Treat the PASETO/EdDSA/envelope-only design as load-bearing. Any Cloud architecture answer that touches the secret must respect these 7 dimensions.

Related: [[project-cloud-vendor-stack]] (the control plane that mints/holds the key), [[project-cloud-feasibility-staleness]] (B3 was written AFTER the feasibility doc, correcting parts of it)