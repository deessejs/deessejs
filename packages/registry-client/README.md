# @workspace/registry-client

> **Status:** private workspace package — consumable only via the pnpm monorepo, not published to npm.

A typed SDK over the DeesseJS template registry. The SDK talks to
**either** the registry HTTP API **or** GitHub directly, depending on
the slug shape. It validates responses against `TemplateV2`, normalises
failures into a typed union, and exposes a uniform
`Result<T, RegistryFailure>` to consumers.

**Runtime:** Node 22+ (the SDK uses `globalThis.fetch`). ESM only.

## What this package does

`createClient` returns an object exposing four methods:

- `getTemplate(slug, options?)` — resolves a slug to a validated
  `TemplateV2` plus a map of `path → URL` for every file the
  consumer needs to download. Use this when you intend to scaffold
  or install the template.
- `info(slug)` — resolves a slug to lightweight `TemplateInfo`
  metadata only (no descriptor fetch, no Zod validation). Use this
  for display, search, or pre-flight checks before downloading.
- `listTemplates()` — returns the editorial catalogue. Cheap call,
  no descriptor fetch.
- `resolveTemplate(slug, options?)` — returns the **resolved** file
  list (`ResolvedTemplate` with `ResolvedTemplateFile[]`), not URLs.
  Use this when you want the resolved paths and kinds without paying
  for the URL fetch step (e.g. `deessejs info`).

### Slug routing

`createClient` parses the slug with `parseGitHubSlug` from
`@workspace/contracts/shared` and routes deterministically:

| Slug shape | Path |
|---|---|
| `owner/repo`, HTTPS URL on `github.com`, SSH URL | Direct from `raw.githubusercontent.com` (descriptor) + `api.github.com` (tree). Bypasses the registry API. |
| HTTPS URL on a non-GitHub host (gitlab.com, etc.) | `Err(RegistryUnsupportedSource)` with the host in the message |
| Anything else (catalogue slug, local path, malformed input) | From the registry API (`POST /api/v1/registry/fetch-descriptor`) |

`listTemplates` is always API-only — the catalogue is editorial and
lives on the server.

## What this package does NOT do

- Scaffold a project. Consumers (CLI, web, mobile, AI agent) do.
- Validate against `TemplateV2` on behalf of the server — the
  server validates, the SDK re-validates as defence-in-depth.
- Cache responses locally. Online-only.
- Retry, offline mode, or rate-limit handling. Add when a real
  consumer needs it.
- Talk to R2 directly. The registry API does.

## Usage

### Resolving a template

```ts
import {
  createClient,
  type FetchedTemplate,
} from "@workspace/registry-client"

const client = createClient({
  apiUrl: process.env.DEESSEJS_API_URL ?? "https://app.deessejs.com",
})

const result = await client.getTemplate("@deessejs/nextjs-saas", {
  ref: "v1.4.0",
})

if (result._tag === "Err") {
  switch (result.error._tag) {
    case "RegistryNotFound":
      console.error("Template not in catalog")
      break
    case "RegistryIncompatibleTemplate":
      // GitHub repo exists but has no/invalid deesse-template.json.
      // result.error.cause: "missing_descriptor" | "invalid_descriptor"
      // result.error.repo: the resolved owner/repo
      console.error(`Incompatible template at ${result.error.repo}`)
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
    case "RegistryTreeFailed":
      // Git tree fetch failed (very large repos, GitHub 5xx, etc.)
      console.error("Tree fetch failed:", result.error.cause)
      break
    case "RegistryUnsupportedSource":
      console.error(`Unsupported source: ${result.error.source}`)
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

### Resolving a V2 glob-based template

When the descriptor declares `includes[]` / `excludes[]` /
`fileTypes{}` (V2 shape) instead of an explicit `files[]` list, the
SDK resolves the tree and returns the file list — no URL fetch by
the consumer needed:

```ts
import { createClient } from "@workspace/registry-client"

const client = createClient({ apiUrl: "..." })

const result = await client.resolveTemplate("deessejs/package-template")

if (result._tag === "Ok") {
  const { descriptor, files, source, treeRef } = result.value
  // source: "github-tree" (direct GitHub) | "descriptor-only" (API)
  // files: ResolvedTemplateFile[] with { path, kind, target?, transform?, source }
  // treeRef: the resolved ref (default "main")
  for (const file of files) {
    console.log(file.path, file.kind, file.source) // "tree" | "descriptor"
  }
}
```

### Listing metadata without download

```ts
const result = await client.info("deessejs/package-template")
if (result._tag === "Ok") {
  console.log(result.value.title, result.value.latestVersion)
  // result.value: { slug, title, description?, layer, versions, labels?, ... }
}
```

### Listing the catalogue

```ts
const result = await client.listTemplates()
if (result._tag === "Ok") {
  for (const entry of result.value) {
    console.log(entry.slug, entry.latestVersion, entry.layer)
  }
}
```

## Error model

The SDK never throws. Every fallible operation returns
`Promise<Result<T, RegistryFailure>>`:

```ts
type Result<T, E> =
  | { _tag: "Ok"; value: T }
  | { _tag: "Err"; error: E }

type RegistryFailure =
  | { _tag: "RegistryNotFound"; slug }
  | { _tag: "RegistryIncompatibleTemplate"; slug; repo; cause? }
  | { _tag: "RegistryFetchFailed"; slug; cause }
  | { _tag: "RegistryInvalidDescriptor"; slug; cause }
  | { _tag: "RegistryNetworkError"; slug; cause }
  | { _tag: "RegistryAuthRequired"; slug }
  | { _tag: "RegistryUnsupportedSource"; source }
  | { _tag: "RegistryTreeFailed"; slug; cause }
```

| `_tag` | When |
|---|---|
| `RegistryNotFound` | Slug not in catalog (HTTP 404 from API) |
| `RegistryIncompatibleTemplate` | The GitHub repo exists but has no `deesse-template.json` (`cause: "missing_descriptor"`) or has one that fails Zod (`cause: "invalid_descriptor"`). `repo` carries the resolved `owner/repo`. |
| `RegistryFetchFailed` | API returned 5xx with a generic upstream failure (not the tree-specific 502) |
| `RegistryInvalidDescriptor` | API returned a payload that didn't validate against `TemplateV2Schema` |
| `RegistryNetworkError` | `fetch` itself failed (DNS, ECONNRESET, timeout) |
| `RegistryAuthRequired` | Template is gated (R2 paid templates, future); HTTP 401/403 |
| `RegistryUnsupportedSource` | Slug was a non-GitHub URL (e.g. `gitlab.com/...`). Defensive guard. |
| `RegistryTreeFailed` | Descriptor is valid but the tree fetch failed — very large repo (`truncated: true`), GitHub API 5xx, or network. The API server tags this with `{ error: "tree fetch failed" }` and the SDK sniffs it on the 5xx path. |

## Environment variables

| Var | Default | Purpose |
|---|---|---|
| `DEESSEJS_API_URL` | — | Fallback for the `apiUrl` constructor argument |
| `DEESSEJS_GITHUB_RAW_BASE` | `https://raw.githubusercontent.com` | Override the raw host (tests, mirror deployments) |
| `DEESSEJS_GITHUB_API_BASE` | `https://api.github.com` | Override the GitHub API host (tests, mirror deployments) |
| `GITHUB_TOKEN` | unset | When set, sent as `Authorization: token <value>` on every GitHub fetch — lifts the 60-req/h anonymous limit to 5000 req/h. The CLI is unopinionated: environment variable, `gh auth token`, 1Password CLI, all work. |

Constructor arguments win over environment variables.

## Public surface

```ts
// Factory
export const createClient: (options: RegistryClientOptions) => RegistryClient

// Interface
export type RegistryClient = {
  getTemplate: (slug, options?) => Promise<Result<FetchedTemplate, RegistryFailure>>
  info: (slug) => Promise<Result<TemplateInfo, RegistryFailure>>
  listTemplates: () => Promise<Result<readonly CatalogEntry[], RegistryFailure>>
  resolveTemplate: (slug, options?) => Promise<Result<ResolvedTemplate, RegistryFailure>>
}

// Types
export type {
  CatalogEntry,
  FetchOptions,
  FetchedTemplate,
  FileKind,
  ObjectKey,
  RegistryClientOptions,
  RegistryFailure,
  ResolvedTemplate,
  ResolvedTemplateFile,
  Result,
  TemplateInfo,
  TemplateV2,
}

// Helpers
export const ok, err, toRegistryError, asRegistryFailure
export const resolveFiles // pure glob resolver — re-exported for advanced consumers

// GitHub-direct helpers (escape hatches — most consumers should go through createClient)
export {
  getInfoFromGithub,
  getRepoExists,
  getTemplateFromGithub,
  resolveTemplateFromGithub,
}
```

## Testing your consumer code

Inject a `fetchImpl` to mock the API in unit tests:

```ts
import { createClient } from "@workspace/registry-client"

const myMockFetch: typeof fetch = async (url) => {
  if (url.toString().endsWith("/catalog")) {
    return new Response(JSON.stringify({ catalog: [...] }), { status: 200 })
  }
  return new Response(JSON.stringify({ descriptor: {...}, files: {...} }), { status: 200 })
}

const client = createClient({
  apiUrl: "https://fake.api",
  fetchImpl: myMockFetch,
})
```

For the GitHub-direct path, set `DEESSEJS_GITHUB_RAW_BASE` and
`DEESSEJS_GITHUB_API_BASE` to your test server's URL and mock those
hosts the same way. See `tests/github.test.ts` for a working
example.

## Out of scope

- Local cache (file, IndexedDB, etc.)
- Retry policy / offline mode
- R2 paid-template gating (handled by the server, surfaced as
  `RegistryAuthRequired`)
- Cryptographic signature verification
- Publication bot

## Versioning

The SDK is consumed by CLI, web, mobile, and AI agent apps. The
shape of `FetchedTemplate`, `ResolvedTemplate`, `TemplateInfo`, and
`CatalogEntry` is part of the public contract — additive evolution
only. Consumers should pin to a specific workspace version.

See ADR-031 / ADR-032 / ADR-036 in `docs/engineering/decisions/`
for the contract evolution rules.