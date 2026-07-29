# 8. SDK (auto-generated)

> Auto-generated TypeScript SDK from the public API's OpenAPI spec. Buyers get their own npm package. Python / Go are v2.

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 8.1 | TypeScript SDK | ✅ | C | Auto-generated from OpenAPI |
| 8.2 | Auto-publish to npm (private registry for buyers) | ✅ | D | **Rare in the band.** Buyers get their own SDK npm package. |
| 8.3 | Auth helper (API key) | ✅ | C | `sdk = new MyProduct({ apiKey })` |
| 8.4 | Typed errors (4xx, 5xx, network) | ✅ | C | Discriminated unions |
| 8.5 | Pagination helpers | ✅ | C | `for await (const item of sdk.list())` |
| 8.6 | Webhook signature verification | ✅ | C | Helper, not manual HMAC |
| 8.7 | Tree-shakeable | ✅ | C | Per-endpoint imports |
| 8.8 | Browser + Node support | ✅ | C | Universal SDK |
| 8.9 | Retry logic (exponential backoff) | ✅ | C | Configurable |
| 8.10 | Python / Go SDKs | ⚪ | — | v2. Buyer's most-requested follow-up; TypeScript first because it's our audience. |

**Notes:**
- 8.2 (auto-publish per buyer) is a serious engineering investment. Decision: ship the generation pipeline + a documented "how to publish to your npm" step, not full automation, in v1. Full automation in v2.

## Cross-references

- Parent: [README.md](./README.md)
- Deep dive: [`../architecture.md`](../architecture.md) — OpenAPI → SDK generation pipeline
- Related: [07-api.md](./07-api.md) — OpenAPI source of truth
- Related: [09-cli.md](./09-cli.md) — CLI shares the same OpenAPI source
