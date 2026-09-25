# @workspace/storage

> **Status:** private workspace package — consumable only via the pnpm monorepo, not published to npm.

A pure object storage abstraction layer for the DeesseJS template registry.

This package owns **physical object storage**: `put`, `get`, `delete`, `head`,
`list` against opaque bytes at opaque keys. It is the layer that talks to
Cloudflare R2 in production and to the local filesystem in dev / CI / tests.

**Runtime:** Node 22+ only (ESM). The R2 adapter uses `Readable.fromWeb` /
`Readable.toWeb`, which require Node's stream APIs and are not available in
Cloudflare Workers without `nodejs_compat`. On Workers, use the R2 binding
directly instead of this package.

## Usage

```ts
import {
  createR2ObjectStore,
} from "@workspace/storage/providers/r2"
import {
  createLocalFsObjectStore,
} from "@workspace/storage/providers/local-fs"
import type { ObjectStore } from "@workspace/storage"

// Production
const store: ObjectStore = createR2ObjectStore({
  accountId: process.env.R2_ACCOUNT_ID!,
  bucket: "templates",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

// Dev / CI / tests
const dev: ObjectStore = createLocalFsObjectStore({ root: ".cache/storage" })

// Read
const stream = await store.get("templates/foo/v1.json")
if (stream === null) throw new Error("not found")
const json = await new Response(stream).json()

// List with paging (returns AsyncIterable<ObjectMeta>)
for await (const meta of store.list("templates/")) {
  console.log(meta.key, meta.size, meta.lastModified)
}

// Write
await store.put("templates/foo/v1.json", new TextEncoder().encode(json))

// Metadata only (cheaper than get())
const meta = await store.head("templates/foo/v1.json")

// Idempotent delete
await store.delete("templates/foo/v1.json")
```

### `ObjectBody` lifecycle

`get()` returns a Web `ReadableStream<Uint8Array>` that **can only be read
once**. Subsequent reads return empty. To abort an in-flight fetch, call
`stream.cancel()`. If you need to re-read or branch on the bytes, drain the
stream into a `Uint8Array` first.

### List semantics

`list(prefix?)` returns an `AsyncIterable<ObjectMeta>`:

- `list()` → every key in the bucket/root
- `list("foo")` → every key that starts with `"foo/"` (trailing slash auto-appended)
- `list("foo/")` → identical to `list("foo")`

Returned keys **include** the prefix (the consumer doesn't need to re-prepend it).
Sort order is unspecified (provider-dependent). The iterable is lazy — break out
at any point without paying for the remaining pages.

### Error semantics

All four error classes are exported from `@workspace/storage/errors` (and
re-exported from the barrel).

| Verb     | 404 outcome                              | Other failure |
| -------- | ---------------------------------------- | ------------- |
| `get`    | returns `null`                           | throws        |
| `head`   | returns `null`                           | throws        |
| `delete` | success (idempotent)                     | throws        |
| `put`    | throws `StorageNotFoundError` (bucket missing) | throws |
| `list`   | empty iterable (if bucket exists) / throws if bucket missing | throws |

The SDK's `S3ServiceException`s are mapped to our taxonomy:

- 401/403 (`InvalidAccessKeyId`, `SignatureDoesNotMatch`, `AccessDenied`) → `StorageAuthError`
- 5xx, network, throttling → `StorageNetworkError`
- The single place we throw `StorageError` directly is on `get()` when the SDK
  returns an empty body (`code: "storage.empty_body"`).

```ts
import {
  StorageAuthError,
  StorageError,
  StorageNetworkError,
  StorageNotFoundError,
} from "@workspace/storage/errors"

try {
  await store.put(key, bytes)
} catch (err) {
  if (err instanceof StorageNotFoundError) {
    // bucket doesn't exist — a config error, not retryable
  } else if (err instanceof StorageAuthError) {
    // credentials invalid — a config error, not retryable
  } else if (err instanceof StorageNetworkError) {
    // 5xx, TLS, DNS — retryable
  } else if (err instanceof StorageError) {
    // currently only thrown for storage.empty_body on get()
  }
}
```

## What this package knows

- Object keys (opaque identifiers, slash-separated paths).
- Object bytes (`Uint8Array`, `ReadableStream`).
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

### Out of scope for V1

The following R2/S3 features are intentionally NOT exposed by `ObjectStore`:
multipart upload, server-side copy, object tagging, pre-signed URLs, range
GETs, ACLs, lifecycle config. If you need one of these, call the
`@aws-sdk/client-s3` SDK directly — `R2ObjectStore`'s `client` parameter is
public for exactly this reason.

## Public surface

```
@workspace/storage                       barrel: types (ObjectStore, ObjectKey,
                                         ObjectMeta, ObjectBody) + 4 error classes
@workspace/storage/errors                4 error classes (re-exported from barrel)
@workspace/storage/object-store          types only (re-exported from barrel)
@workspace/storage/providers/local-fs    createLocalFsObjectStore factory
@workspace/storage/providers/r2          createR2ObjectStore factory
```

The package is functional at the API boundary: `ObjectStore` is an interface
whose implementations are objects of async functions. There are no provider
classes in this package — only factories that return `ObjectStore`-shaped
values. The `S3Client` instance is the only class-shaped value, and it
belongs to the SDK at the I/O boundary, not to this package.

Providers are imported explicitly at the call site so tree-shaking is
declarative and there is no provider registry to leak.

## Implementations

### `createLocalFsObjectStore(options)` — disk-backed

For dev, CI, and tests. Returns an `ObjectStore` whose methods close
over a resolved `root` directory. No credentials, no network. Keys are
slash-separated paths; `list(prefix)` is a key-prefix filter, not a
directory path.

**Options:**

```ts
interface LocalFsOptions {
  /** Root directory. Resolved against process.cwd() if relative. */
  root: string
  /** Auto-create the root on first use. Defaults to true. */
  ensureRoot?: boolean
}
```

**Atomicity:** writes go to `<key>.tmp.<random>`, then rename to the final
path. Concurrent puts to the same key race on the rename, but the outcome
is one of the two complete bodies — never partial, never a torn file.
Stale `.tmp` files left by failed writes are best-effort cleaned up.

**Memory:** `get()` reads the entire file into memory before returning the
stream. R2 streams from the SDK. Avoid storing objects larger than a few
MB in local-fs.

### `createR2ObjectStore(options)` — Cloudflare R2

For production. Returns an `ObjectStore` whose methods close over a
constructed `S3Client` and the resolved bucket name.

**Options:**

```ts
interface R2Options {
  /** Cloudflare account ID (numeric). */
  accountId: string
  /** R2 bucket name. */
  bucket: string
  /** Pre-read credentials. */
  credentials: { accessKeyId: string; secretAccessKey: string }
  /** Inject a custom S3Client (e.g. for testing or retry tuning). */
  client?: S3Client
  /** Additional SDK config (retry policy, request handler). */
  clientConfig?: Omit<S3ClientConfig, "endpoint" | "region" | "credentials">
}
```

The factory configures the `S3Client` with region `"auto"` and endpoint
`https://<account>.r2.cloudflarestorage.com` per Cloudflare's R2 spec.

**The SDK owns:** SigV4 signing, key URL encoding, XML parsing and entity
decoding, `ListObjectsV2` pagination via `paginateListObjectsV2`, HTTP
transport, retries, error parsing.

**The adapter owns:** verb → SDK command translation, mapping SDK errors
to our 4-class taxonomy, ETag quote-stripping, Node `Readable` → Web
`ReadableStream` conversion on `get()`, Web `ReadableStream` → Node
`Readable` conversion on `put()` (the SDK's `PutObjectCommand` wants a
Node stream).

### `ObjectMeta.etag` is opaque

S3-compatible ETags are MD5 only for single-part PUTs of small bodies. For
multipart uploads, multi-part objects, or composite operations, the ETag is
a composite identifier that does not match the body byte-for-byte. If you
need integrity verification, hash the body yourself at write time and store
the digest alongside the key.

## Testing your consumer code

`createR2ObjectStore({ ..., client })` accepts an injected `S3Client`. The
SDK paginator (`paginateListObjectsV2`) checks `instanceof S3Client`
internally, so you must instantiate a real client and stub its `send`
method — duck-typed object literals will not work.

```ts
import { S3Client } from "@aws-sdk/client-s3"
import { createR2ObjectStore } from "@workspace/storage/providers/r2"

const fakeClient = new S3Client({
  region: "auto",
  endpoint: "https://fake.r2.cloudflarestorage.com",
  credentials: { accessKeyId: "x", secretAccessKey: "y" },
})
fakeClient.send = async (cmd) => {
  // return canned responses per command type
}

const store = createR2ObjectStore({
  accountId: "fake",
  bucket: "test",
  credentials: { accessKeyId: "x", secretAccessKey: "y" },
  client: fakeClient,
})
```

`tests/r2-contract.test.ts` ships an in-memory bucket mock that you can
copy or adapt.

## Tests

Two test layers run side by side:

- **`tests/object-store.contract.ts`** — a factory
  `runObjectStoreContractTests(label, factory)` that runs the same suite
  of contract tests against any `ObjectStore` implementation. Both
  `createLocalFsObjectStore` and `createR2ObjectStore` (with an
  in-memory `S3Client` mock) are wired through it, so any future
  divergence between providers fails the contract suite.

- **Provider-specific tests** (`local-fs.test.ts`, `r2.test.ts`,
  `r2-contract.test.ts`) — cover details that don't belong in the
  shared contract: path-traversal defenses and atomic-write guarantees
  for local-fs; SDK command shape and error mapping for R2; the
  in-memory bucket mock used to run the contract suite against R2.

A real-R2 round-trip integration test belongs to a follow-up PR gated on
a CI secret.

## Adding a new provider

If `LocalFsObjectStore` and `R2ObjectStore` don't cover your backend
(MinIO, Backblaze B2, an in-memory mock for tests…), create a new file
under `packages/storage/src/providers/<name>.ts` exporting a factory:

```ts
export function createMyObjectStore(options: MyOptions): ObjectStore {
  // ...resolve state once...
  return { put, get, delete, head, list }
}
```

`ObjectStore` is the only contract. Every method is async. `get` and
`head` must return `null` on a missing object, not throw. `list` must
yield an `AsyncIterable<ObjectMeta>`. The contract test factory in
`tests/object-store.contract.ts` will validate your implementation for
free.

Never edit an existing provider's wire-level concerns (SigV4, XML
parsing, key encoding) — those belong to the AWS SDK, not this package.

## Changelog

Prior versions of this README documented a hand-rolled SigV4 signer
(`src/internal/sigv4.ts`) and a hand-rolled XML parser. Both were removed
in favour of `@aws-sdk/client-s3`. The current package is roughly 30%
fewer lines of code than the hand-rolled version, with the SDK owning
all S3-protocol concerns.
