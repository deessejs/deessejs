# 7. API (internal + public)

> Two APIs. oRPC for the web app (type-safe, internal). Hono for the public REST API (mounted in Next.js, generates OpenAPI). Stripe / Linear / Resend pattern. The differentiator is API analytics in the admin dashboard + per-tenant quotas.

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 7.1 | Internal API — oRPC | ✅ | C | Type-safe, used by the web app |
| 7.2 | Public API — REST (Hono) | ✅ | C | Mounted in Next.js at `/api/v1` |
| 7.3 | OpenAPI spec generation | ✅ | C | Auto-generated from Hono routes |
| 7.4 | API versioning | ✅ | U | `/api/v1/...`, future `/api/v2/...` |
| 7.5 | API auth (API keys) | ✅ | C | Generated per user/org, scoped |
| 7.6 | Rate limiting (per key, per org) | ✅ | C | Upstash Redis |
| 7.7 | Pagination (cursor + offset) | ✅ | C | Both styles, buyer picks |
| 7.8 | Filtering (per field) | ✅ | C | Standard operators |
| 7.9 | Sorting (per field, multi) | ✅ | C | Standard |
| 7.10 | Field selection (sparse fieldsets) | 🟡 | U | Architecture supports; shipped in core endpoints |
| 7.11 | Webhooks (out, per org) | ✅ | C | Buyer can subscribe; HMAC-signed |
| 7.12 | Webhooks (in, for triggering) | ✅ | C | HTTP endpoint → job |
| 7.13 | API analytics (per org) | ✅ | D | Calls, errors, latency, p95 — visible in the admin dashboard |
| 7.14 | Playground (OpenAPI explorer) | ✅ | D | Scalar or Swagger UI, branded; **rare in the band** |
| 7.15 | Per-tenant quotas | ✅ | D | Configurable per plan; enforced in middleware |

**Notes:**
- The two APIs (oRPC + Hono) are a real differentiator — Stripe, Linear, and Resend do this. Most templates ship a single REST API for everything.
- 7.14 (playground) is small but it's the surface where API buyers evaluate the product. Worth doing.
- 7.13 (analytics) is more granular than Stripe / Resend — those are billing analytics. We ship API analytics in the product.

## Cross-references

- Parent: [README.md](./README.md)
- Deep dive: [`../architecture.md`](../architecture.md) — oRPC + Hono + OpenAPI pipeline
- Related: [08-sdk.md](./08-sdk.md) — auto-generated TS SDK from this OpenAPI
- Related: [09-cli.md](./09-cli.md) — CLI consumes the same OpenAPI
- Related: [04-background-jobs.md](./04-background-jobs.md) — webhook triggers
- Related: [14-documentation.md](./14-documentation.md) — auto-generated API reference
