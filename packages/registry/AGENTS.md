# packages/registry

This package owns the author-side template descriptor contract and the shared
registry interpretation logic. It validates descriptors, reads immutable
source snapshots, selects distributable files and creates installation plans.
Materialization remains the responsibility of the CLI.

## Key files

| Path | Owns |
|---|---|
| `src/v1/template-descriptor.ts` | Strict V1 structure, normalized parse result and stable diagnostics. |
| `src/v1/template-source.ts` | GitHub source resolution, complete inventory and byte reads. |
| `src/v1/installation-plan.ts` | Descriptor validation, file selection and deterministic plans. |
| `README.md` | Consumer API and V1 planning behavior. |
| `schema/template/v1.json` | Generated editor schema for the public V1 descriptor URL. |
| `scripts/generate-template-schema.mjs` | Generate or check the committed JSON Schema. |

## Contract rules

- V1 rejects unknown fields at every object level.
- Runtime validation uses the bundled Zod contract. It does not fetch the
  public schema URL.
- An omitted `includes` defaults to `["**/*"]`; an explicitly empty array is
  invalid.
- Structural validation does not inspect a repository or execute template
  instructions. Plan construction uses the source adapter and never writes files.
- Resolve descriptor, inventory and file bytes from one immutable commit. Reject
  truncated GitHub inventories and selected symlinks or unsafe paths.
- Apply includes before excludes, match dotfiles case-sensitively with
  Picomatch, deduplicate and sort source paths, and reject an empty selection.
- Keep the generated schema aligned by running `schema:check` in CI.

## Commands

```bash
pnpm --filter @workspace/registry schema:generate
pnpm --filter @workspace/registry schema:check
pnpm --filter @workspace/registry build
pnpm --filter @workspace/registry typecheck
pnpm --filter @workspace/registry lint
pnpm --filter @workspace/registry test:run
```
