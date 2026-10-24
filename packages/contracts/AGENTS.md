# packages/contracts

You own the wire format: the Zod schemas that define what crosses the network between the server, the CLI and the web app. A shape defined here is a promise to every client that already ships.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace: the API path, the auth base path, the wire contracts, the research protocol and the git workflow. Read it when your change touches one of them, not before every edit.

## Key files

| Path | Owns |
|---|---|
| `src/v1/template.ts` | `TemplateV1`, the shape of one registry entry. |
| `src/v1/templates-response.ts` | `TemplatesListResponseV1`, the wrapper around the list. |
| `src/v1/index.ts` | The V1 barrel. |
| `src/index.ts` | The root barrel, exposing the versions as namespaces. |

## Application boundary

Applications consume backend capabilities through typed clients. These contracts define the client-visible shapes; they do not authorize an application to import `@workspace/auth`, `@workspace/database` or another service implementation directly. Add or extend a client/API contract when an application needs a backend operation.

## The rule that matters

**The schemas use the default Zod object mode, which strips unknown keys.** A client that validates a response against them is not broken by a new field, whether that field is optional or required.

What breaks a client is a change to a field it already knows: removing it, renaming it, changing its type, narrowing the set of accepted values, or adding a constraint the existing values do not satisfy.

Two consequences for how you work:

- **Adding a field is backward compatible.** Make it optional when the value can be absent, required when the server always sends it.
- **The mode of the schema is part of the rule.** A switch to `.strict()` rejects the unknown keys the default mode strips, and would make every new field breaking for the clients that validate with it. Changing the mode is a breaking change in itself.

Keep in mind what the guarantee is today: the oRPC procedure types its response with `TemplatesListResponseV1` rather than attaching it as a runtime output schema, so the contract is enforced at compile time on both sides. The CLI reserves a `parse_error` code for a response that does not match the contract.

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
| `apps/cli` | Types what it reads from the endpoint with the shared contract. |
| `apps/web` | Renders the catalogue pages from the same contract. |
| `apps/app` | Reads the contract for the types it displays. |

## Related guides

- [Root guide](../../AGENTS.md)
- [packages/api](../api/AGENTS.md)
- [apps/cli](../../apps/cli/AGENTS.md)
