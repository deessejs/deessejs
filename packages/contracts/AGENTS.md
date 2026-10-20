# packages/contracts

You own the wire format: the Zod schemas that define what crosses the network between the server, the CLI and the web app. A shape defined here is a promise to every client that already ships.

Read [the root guide](../../AGENTS.md) first. It holds the invariants that apply everywhere.

## Key files

| Path | Owns |
|---|---|
| `src/v1/template.ts` | `TemplateV1`, the shape of one registry entry. |
| `src/v1/templates-response.ts` | `TemplatesListResponseV1`, the wrapper around the list. |
| `src/v1/index.ts` | The V1 barrel. |
| `src/index.ts` | The root barrel, exposing the versions as namespaces. |

## The rule that matters

**Adding a required field to a published contract is a breaking change.** The CLI clients already installed in the world parse the payload with these schemas, and a Zod parse of an unknown required field throws. The failure surfaces to the user as a `parse_error` on a command that worked yesterday.

So a new field is optional, or it lands in a new version.

## How the versions work

- Each contract version lives under `src/vN/`.
- The HTTP prefix mirrors the version: `/api/v1` serves the V1 contracts. When a V2 appears, the API keeps serving V1 for the clients that are already installed.
- Consumers import the version they need: `import { TemplateV1 } from "@workspace/contracts/v1"`. Never import a shape from the root barrel without naming its version.

## Conventions

- **The response is a wrapper, not a bare array.** `TemplatesListResponseV1` is `{ templates: TemplateV1[] }`, so that `meta`, `pagination` or `error` can be added later without breaking the contract.
- **Optional fields keep the shape backward compatible.** A client that does not know a field continues to parse the response.
- **Every shape has a comment that says who consumes it** and what breaks when it changes. Keep that comment accurate when you edit the schema.
- The schemas are Zod objects. Infer the TypeScript type from the schema, never write it twice.

## Commands

```bash
pnpm build         # tsc
pnpm test          # vitest
pnpm test:run
pnpm typecheck
pnpm lint
```

The test file is `tests/template.test.ts`.

## Consumers

| Consumer | What it takes |
|---|---|
| `packages/api` | Builds the response from the curated rows and the live enrichment. |
| `apps/cli` | Parses the registry response and fails with `parse_error` on an unknown shape. |
| `apps/web` | Renders the catalogue pages from the same contract. |
| `apps/app` | Reads the contract for the types it displays. |

## Related guides

- [Root guide](../../AGENTS.md)
- [packages/api](../api/AGENTS.md)
- [apps/cli](../../apps/cli/AGENTS.md)
