# Cloudflare R2

## Decision

**Cloudflare R2** (S3-compatible object storage) for all file storage in the template.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## Scope

R2 is used for:

- **Avatars and profile images** (per Better Auth defaults).
- **Org assets** (logos, brand images).
- **User-uploaded files** (per feature 6.1).
- **Public exports** (per feature 6.5: signed URLs for time-limited access).
- **Multi-part uploads** for large files (per feature 6.8).

R2 is **not** used for:

- The Postgres database (Drizzle).
- Caching / sessions (Upstash Redis).
- Realtime channels (Upstash Realtime).

## What R2 gives us

1. **S3-compatible API.** Use the AWS SDK v3 (`@aws-sdk/client-s3`) — works the same as S3.
2. **Zero egress fees.** $0.015/GB/month storage. The buyer never gets a surprise bill for serving their own files.
3. **Cloudflare CDN integration.** Files served from Cloudflare's edge, fast globally.
4. **Presigned URLs for direct upload/download.** The browser uploads directly to R2 without proxying through Next.js (per feature 6.2).
5. **Multi-part upload** for large files (per feature 6.8).
6. **CORS configuration** for browser-side access.

## Why R2 (not AWS S3, not Cloudflare Images alone, not Supabase Storage)

| Alternative | Why not |
|---|---|
| **AWS S3** | Egress fees. The buyer's bill grows linearly with traffic. R2 has zero egress. |
| **Cloudflare Images** | For image transformations only. Not a general object store. We use it as a complement (per feature 6.3), not a replacement. |
| **Supabase Storage** | Tied to Supabase. We're Postgres-agnostic. |
| **Backblaze B2** | S3-compatible, cheaper than S3, but R2 has better edge integration. |
| **UploadThing** | Convenient SDK, but adds a vendor. R2 with our own thin SDK is simpler. |
| **Vercel Blob** | Vercel-only. Couples us to Vercel. |
| **Self-hosted MinIO** | Operational burden. Not what the buyer signed up for. |

R2 wins on:

- **Zero egress** — the killer feature for any SaaS with file uploads.
- **S3 API compatibility** — familiar, well-tooled.
- **Cloudflare CDN** — files served fast globally by default.
- **Direct browser upload** — no proxying through our Next.js (saves bandwidth and timeouts).

## Architecture

```
Browser → R2 (via presigned URL, direct)
       │
       └── Cloudflare CDN (serves the file)

App → R2 (via AWS SDK, for metadata + signed URL generation)
    │
    └── Postgres (file metadata: filename, size, MIME, uploader, org)
```

The app generates presigned URLs; the browser uploads directly to R2. Metadata is in Postgres (per feature 6.10).

## Per-org access control (feature 6.6)

R2 has no native per-object ACL. We enforce it at the application layer:

- Every R2 object key is prefixed with the org ID: `orgs/<orgId>/<path>/<file>`.
- When generating a presigned URL, the app checks the requester belongs to the org.
- Signed URLs are scoped to the specific object key (no wildcard).

The buyer can add bucket-per-org (feature 6.7) if they want stronger isolation, but the prefix approach is the v1 default.

## Image transformations (feature 6.3)

Two options:

1. **Cloudflare Images** — managed transformation service. Add `cf-image` query params to any R2 URL.
2. **R2 + custom Lambda** — DIY transformations. More control, more ops.

We ship with **Cloudflare Images** as the default. The buyer can switch to DIY if they need more control.

## Constraints

- **No public buckets.** All access via presigned URLs or signed URLs.
- **CORS configured for the buyer's domain.** The buyer sets this once at deploy time.
- **Metadata in Postgres, not in R2 object metadata.** R2 object metadata is limited and not queryable. Postgres is the source of truth for search (feature 6.11).
- **Antivirus on uploads is the buyer's job** (feature 6.9, skipped in v1). Documented in the buyer's deploy guide.

## Failure modes

| Failure | Mitigation |
|---|---|
| R2 outage | Uploads fail gracefully. Reads fall back to a CDN cache if configured. |
| Large file upload timeout | Browser direct upload (not via Next.js) avoids the function timeout. Multi-part upload handles >5GB. |
| Storage cost spike | The buyer sets a Cloudflare budget alert. |

## Cross-references

- [`../10-decisions/`](../10-decisions/) — ADR for storage (when written).
- [`../../product/features/06-storage.md`](../../product/features/06-storage.md) — the storage feature inventory.
- [`./cloudflare-images.md`](./cloudflare-images.md) — image transformations (future ADR).
