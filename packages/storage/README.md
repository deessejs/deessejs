# @workspace/storage

A pure object storage abstraction layer for the DeesseJS template registry.

This package owns **physical object storage**: `put`, `get`, `list`, `delete`,
`head` against opaque bytes at opaque keys. It is the layer that talks to
Cloudflare R2 (and, later, to S3, MinIO, or any S3-compatible backend).

## What this package knows

- Object keys (opaque identifiers, slash-separated paths).
- Object bytes (Uint8Array, ReadableStream).
- Object metadata (size, content-type, etag — opaque, **not** a content hash).
- How to wire a provider-specific SDK call to the `ObjectStore` verbs.

## What this package does NOT know

- Templates, blocks, or descriptors.
- JSON parsing, Zod validation, or schema URLs.
- Namespaces like `@deessejs/...` or `@acme/...`.
- The CLI, the registry front-end, or any consumer surface.
- Lockfiles, install sequences, or `deesse.json`.
- The S3 wire protocol (SigV4 signing, XML request/response format,
  pagination tokens). Those belong to the AWS SDK, not this package.

Higher-level concerns live in `@workspace/registry-client` (dispatch +
parsing + cache + offline). This package is the bytes layer.

## Public surface

```
@workspace/storage                       barrel
@workspace/storage/errors                typed error classes
@workspace/storage/object-store          ObjectStore interface + types
@workspace/storage/providers/local-fs   disk-backed impl (dev/test)
@workspace/storage/providers/r2          Cloudflare R2 impl (prod)
```

`internal/` is not exported. The two providers are imported explicitly at
the call site so tree-shaking is declarative and there is no provider
registry to leak.

## Implementations

### `LocalFsObjectStore` — disk-backed

For dev, CI, and tests. Implements the same `ObjectStore` interface against
the local filesystem under a configurable root. No credentials, no network.
Keys are slash-separated paths; `list(prefix)` is a key-prefix filter, not a
directory path.

### `R2ObjectStore` — Cloudflare R2

For production. A thin adapter over `@aws-sdk/client-s3` configured with
Cloudflare R2's endpoint (`https://<account>.r2.cloudflarestorage.com`,
region `"auto"`, service `"s3"`).

The SDK owns:
- SigV4 signing (correct key encoding — no double-encoding bugs).
- Key encoding in URLs (RFC 3986).
- XML response parsing and entity decoding.
- `ListObjectsV2` pagination via `paginateListObjectsV2`.
- HTTP transport, retries, error parsing.

The adapter only owns:
- `ObjectStore` verb → SDK command translation.
- Mapping SDK `S3ServiceException`s to our 4-class error taxonomy
  (`StorageNotFoundError`, `StorageAuthError`, `StorageNetworkError`,
  `StorageError`).
- ETag quote-stripping for downstream consumers.
- Node `Readable` → Web `ReadableStream` conversion on `get()`.

## Tests

Two test layers run side by side:

- **`tests/object-store.contract.ts`** — a factory
  `runObjectStoreContractTests(label, factory)` that runs the same suite
  of contract tests against any `ObjectStore` implementation. Both
  `LocalFsObjectStore` and `R2ObjectStore` (with a mocked `S3Client`) are
  wired through it, so any future divergence between providers fails the
  contract suite.

- **Provider-specific tests** (`local-fs.test.ts`, `r2.test.ts`) — cover
  details that don't belong in the shared contract: path-traversal
  defenses and atomic-write guarantees for local-fs; SDK command shape
  and error mapping for R2.

A real-R2 round-trip integration test belongs to a follow-up PR gated on
a CI secret.

## Versioning

V1 ships with `LocalFsObjectStore` and `R2ObjectStore`. New implementations
are added by creating a new file in `providers/` — never by editing an
existing provider's wire-level concerns. If you find yourself reaching for
SigV4 internals or raw HTTP, you are probably duplicating SDK work.
