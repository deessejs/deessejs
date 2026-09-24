# @workspace/storage

Descriptor acquisition for the DeesseJS template registry.

This package is the **input channel** for the registry: given a slug and a version
reference, hand back the parsed descriptor. It is intentionally narrow — write and
search operations belong to other packages. The interface (`DescriptorProvider`)
exposes only what an `add` or `init` consumer needs.

## Scope (V1)

| Concern | V1 | V2 | V3 |
|---|---|---|---|
| Provider: git tags (via `codeload.github.com`) | yes | yes | yes |
| Provider: R2 (Cloudflare R2 + Workers Access) | no | yes | yes |
| Provider: Neon Object Storage (branch-aware) | no | no | yes |
| ETag/revalidation cache (`~/.deessejs/`) | yes | yes | yes |
| Authenticated providers (V2/V3) | interface only | impl | impl |
| Branching providers (preview env per PR) | interface only | no | impl |

The git-tags provider serves the public registry. Authenticated and branching
providers ship as optional extensions through `BranchableDescriptorProvider` and
`AuthenticatedDescriptorProvider` so consumers compose them at the boundary,
not as methods on the base interface (per ADR-036 §4: extensions are new
types, never enrichment of frozen interfaces).

## Public surface

```
@workspace/storage              → barrel: re-exports provider + errors
@workspace/storage/errors       → typed error classes
@workspace/storage/envelope     → WireEnvelope Zod schema
@workspace/storage/provider     → DescriptorProvider interface
@workspace/storage/resolve      → URL builders + ref parsing
@workspace/storage/providers/git-tags → git-tags implementation (V1)
```

Internal helpers (`internal/`) are not exported. Provider subpaths
(`@workspace/storage/providers/git-tags`, etc.) are intentional — there is
no `providers/index.ts` barrel. Consumers pick the provider they need at
their call site, which keeps tree-shaking explicit.

## CLI offline invariant

Per ADR-033 §171, the CLI must not make outbound HTTP in a CI environment.
This package detects `process.env.CI === 'true'` (and the explicit
`DEESSE_OFFLINE=true` override) and refuses to fetch. It throws
`StorageOfflineViolationError` when asked to read through without a
cache hit. See `offline.ts`.
