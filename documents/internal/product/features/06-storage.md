# 6. Storage

> Cloudflare R2 over S3 (zero egress). Direct browser upload, signed URLs, image transformations. Anti-virus is the buyer's job (documented).

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 6.1 | Cloudflare R2 (S3-compatible) | ✅ | C | Confirmed |
| 6.2 | Browser direct upload (presigned URLs) | ✅ | C | Doesn't proxy through Next.js |
| 6.3 | Image transformations (resize, crop, format) | ✅ | C | Cloudflare Images or R2 + custom Lambda |
| 6.4 | CDN delivery (R2 + Cloudflare) | ✅ | C | R2 has zero egress |
| 6.5 | Signed URLs (time-limited) | ✅ | C | Private asset access |
| 6.6 | Access control (per org) | ✅ | C | R2 prefix per org |
| 6.7 | Bucket per org (multi-tenant) | 🔵 | — | v1 ships shared bucket with org-prefix; per-org bucket is a v2 buyer pattern |
| 6.8 | Multi-part upload (large files) | ✅ | C | R2 native |
| 6.9 | Antivirus scanning | ⚪ | — | Out of scope. Buyer wires Cloudflare's AV layer or a third-party. |
| 6.10 | File metadata (in our DB) | ✅ | C | Filename, size, MIME, uploader, org |
| 6.11 | File search (by name, tag) | 🟡 | U | Basic in v1; buyer can wire Algolia later |

**Notes:**
- R2 was chosen over S3 for zero egress — saves the buyer real money at scale.
- 6.11 (search) is shipped as a basic SQL query in v1; Algolia integration is documented as a buyer add-on.

## Cross-references

- Parent: [README.md](./README.md)
- Deep dive: [`../architecture.md`](../architecture.md) — R2 client setup
- Related: [01-auth-and-identity.md](./01-auth-and-identity.md) — avatar upload
- Related: [10-ui.md](./10-ui.md) — file picker component
