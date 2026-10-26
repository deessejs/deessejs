# packages/registry

This package owns the author-side template descriptor contract and the shared
registry interpretation logic. The first increment defines the structural V1
contract and its generated editor schema. Source resolution, file selection,
installation planning and materialization are separate responsibilities added
by later increments.

## Key files

| Path | Owns |
|---|---|
| `src/v1/template-descriptor.ts` | Strict V1 structure, normalized parse result and stable diagnostics. |
| `schema/template/v1.json` | Generated editor schema for the public V1 descriptor URL. |
| `scripts/generate-template-schema.mjs` | Generate or check the committed JSON Schema. |

## Contract rules

- V1 rejects unknown fields at every object level.
- Runtime validation uses the bundled Zod contract. It does not fetch the
  public schema URL.
- An omitted `includes` defaults to `["**/*"]`; an explicitly empty array is
  invalid.
- Structural validation does not inspect a repository or execute template
  instructions.
- Keep the generated schema aligned by running `schema:check` in CI.

## Commands

```bash
pnpm --filter @workspace/registry schema:generate
pnpm --filter @workspace/registry schema:check
pnpm --filter @workspace/registry build
pnpm --filter @workspace/registry typecheck
pnpm --filter @workspace/registry lint
```
