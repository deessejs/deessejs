# @workspace/registry-client

> **Status:** private workspace package — consumable only via the pnpm monorepo, not published to npm.

A typed SDK over the DeesseJS template registry. The SDK wraps the
registry HTTP API, validates responses, and exposes a uniform
`Result<T, RegistryFailure>` shape to consumers.

**Runtime:** Node 22+ (the SDK uses `globalThis.fetch`). ESM only.

## What this package does

Provides a single factory `createRegistryClient` that returns an
object with two methods:

- `fetchDescriptor(slug, options?)` — resolves a slug to a validated
  `TemplateV2` plus URLs for each file declared in `descriptor.files[]`.
- `listCatalog()` — returns the editorial list of available templates.

It does **not** talk to GitHub or R2 directly. The server-side
registry API handles resolution, source fetching, descriptor
validation, and (future) access control for paid templates. The SDK
is a thin, typed proxy.

## What this package does NOT do

- Talk to GitHub or R2 directly. The registry API does.
- Validate templates against `TemplateV2` (defence-in-depth re-validation
  happens internally, but the schema lives in `@workspace/contracts/v2`).
- Cache responses locally. V1 is online-only.
- Scaffold a project. That's a consumer's job (CLI, web, etc.).
- Handle retries, offline mode, or rate limiting. Add when a real
  consumer needs it.

## Usage

```ts
import {
  createRegistryClient,
  type FetchedTemplate,
} from "@workspace/registry-client"

const client = createRegistryClient({
  apiUrl: "https://app.deessejs.com",
})

const result = await client.fetchDescriptor("@deessejs/nextjs-saas", {
  ref: "v1.4.0",
})

if (result._tag === "Err") {
  switch (result.error._tag) {
    case "RegistryNotFound":
      console.error("Template not in catalog")
      break
    case "RegistryNetworkError":
      console.error("Cannot reach registry")
      break
    case "RegistryInvalidDescriptor":
      console.error("Template is corrupted; please report")
      break
    case "RegistryAuthRequired":
      console.error("This template requires authentication")
      break
    case "RegistryFetchFailed":
      console.error("Registry upstream failed; try again later")
      break
    case "RegistryUnsupportedSource":
      console.error(`Registry reported unsupported source: ${result.error.source}`)
      break
  }
  process.exit(1)
}

const { descriptor, files } = result.value

// descriptor: TemplateV2 (validated by Zod)
// files: { [path: string]: string } — opaque URLs the consumer fetches
for (const file of descriptor.files ?? []) {
  const url = files[file.path]
  // await fetch(url) ...
}
```

### Listing the catalog

```ts
const result = await client.listCatalog()
if (result._tag === "Ok") {
  for (const entry of result.value) {
    console.log(entry.slug, entry.latestVersion, entry.layer)
  }
}
```

### Error model

The SDK never throws. Every fallible operation returns
`Result<T, RegistryFailure>`:

```ts
type Result<T, E> =
  | { _tag: "Ok"; value: T }
  | { _tag: "Err"; error: E }

type RegistryFailure =
  | { _tag: "RegistryNotFound"; slug }
  | { _tag: "RegistryFetchFailed"; slug; cause }
  | { _tag: "RegistryInvalidDescriptor"; slug; cause }
  | { _tag: "RegistryNetworkError"; slug; cause }
  | { _tag: "RegistryAuthRequired"; slug }
  | { _tag: "RegistryUnsupportedSource"; source }
```

| `_tag` | When |
|---|---|
| `RegistryNotFound` | Slug not in catalog (HTTP 404 from API) |
| `RegistryFetchFailed` | API returned 5xx (upstream GitHub/R2 problem) |
| `RegistryInvalidDescriptor` | API returned a payload that didn't validate against `TemplateV2Schema` |
| `RegistryNetworkError` | `fetch` itself failed (DNS, ECONNRESET, timeout) |
| `RegistryAuthRequired` | Template is gated (R2 paid templates, future) |
| `RegistryUnsupportedSource` | Should never happen; defensive guard |

## Public surface

```ts
// Factory
export const createRegistryClient: (options: RegistryClientOptions) => RegistryClient

// Interface
export type RegistryClient = {
  fetchDescriptor: (slug, options?) => Promise<Result<FetchedTemplate, RegistryFailure>>
  listCatalog: () => Promise<Result<CatalogEntry[], RegistryFailure>>
}

// Types
export type FetchedTemplate, CatalogEntry, FetchOptions, Result, ObjectKey, TemplateV2

// Helpers
export const ok, err, toRegistryError, asRegistryFailure
```

## Testing your consumer code

Inject a `fetchImpl` to mock the API in unit tests:

```ts
import { createRegistryClient } from "@workspace/registry-client"

const myMockFetch: typeof fetch = async (url) => {
  if (url.toString().endsWith("/catalog")) {
    return new Response(JSON.stringify({ catalog: [...] }), { status: 200 })
  }
  return new Response(JSON.stringify({ descriptor: {...}, files: {...} }), { status: 200 })
}

const client = createRegistryClient({
  apiUrl: "https://fake.api",
  fetchImpl: myMockFetch,
})
```

`tests/mock-client.test.ts` in this package uses the same pattern —
copy or adapt.

## Out of scope for V1

- Local cache (file, IndexedDB, etc.)
- Retry policy / offline mode
- R2 paid-template gating
- Cryptographic signature verification
- Web, mobile, AI agent consumers (V1: CLI only)
- Publication bot

## Versioning

V1 ships with one method (`fetchDescriptor`) returning
`TemplateV2` plus `Record<path, url>`. The shape may evolve; consumers
should pin to a specific version of this package.
