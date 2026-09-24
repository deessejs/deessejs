# @workspace/storage

A pure object storage abstraction layer for the DeesseJS template registry.

This package owns **physical object storage**: `put`, `get`, `list`, `delete`,
`head` against opaque bytes at opaque keys. It is the layer that talks to
Cloudflare R2 (and, later, to S3, MinIO, or any S3-compatible backend).

## What this package knows

- Object keys (opaque identifiers, slash-separated paths).
- Object bytes (Uint8Array, ReadableStream).
- Object metadata (size, content-type, etag).
- HTTP-level concerns: SigV4 signing, multipart boundaries, retry semantics.

## What this package does NOT know

- Templates, blocks, or descriptors.
- JSON parsing, Zod validation, or schema URLs.
- Namespaces like `@deessejs/...` or `@acme/...`.
- The CLI, the registry front-end, or any consumer surface.
- Lockfiles, install sequences, or `deesse.json`.

Those concerns live in `@workspace/registry-client` (dispatch + parsing
+ cache + offline), and elsewhere. This package is the bytes layer.

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

### `R2ObjectStore` — Cloudflare R2

For production. Uses `internal/sigv4.ts` to sign every request; transport
is the standard `fetch` API. The signer uses only `globalThis.crypto.subtle`
— no Node-specific API, so the same module runs in Node 20+, Cloudflare
Workers, Deno, Bun, and modern browsers without changes.

The signer is verified against the 12 official AWS SigV4 test vectors. See
`tests/sigv4.test.ts` for the exact fixtures.

## Versioning

V1 ships with `LocalFsObjectStore` only. `R2ObjectStore` lands when the first
commercial customer needs private template storage — gated on a real R2
account and credentials. There is no V1 / V2 split inside this package;
new implementations are added by creating a new file in `providers/`.
