# `@workspace/contracts`

The wire format of DeesseJS: the Zod schemas that define what crosses the network between the server, the CLI and the web app.

## What's included

- **`TemplateV1`**: the shape of one template entry in the registry
- **`TemplatesListResponseV1`**: the wrapper around the list of templates

Both live under `src/v1/`, one directory per contract version.

## Usage

Build the response on the server:

```ts
import { TemplatesListResponseV1 } from "@workspace/contracts/v1"

const body: TemplatesListResponseV1 = { templates }
```

Type what you read on the client:

```ts
import type { TemplatesListResponseV1 } from "@workspace/contracts/v1"

type Template = TemplatesListResponseV1["templates"][number]
```

## Exports

| Export | Import path | Contents |
|---|---|---|
| `.` | `@workspace/contracts` | The versions, as namespaces |
| `./v1` | `@workspace/contracts/v1` | The V1 schemas and their types |

## Adding a field

**The schemas use the default Zod object mode, which strips unknown keys.** A client that validates a response against them is not broken by a new field, whether that field is optional or required.

What breaks a client is a change to a field it already knows: removing it, renaming it, changing its type, narrowing the set of accepted values, or adding a constraint the existing values do not satisfy.

The mode of the schema is part of the rule. A switch to `.strict()` rejects the unknown keys the default mode strips, and would make every new field breaking for the clients that validate with it.

## Commands

```bash
pnpm build
pnpm test
pnpm test:run
pnpm typecheck
pnpm lint
```

## Notes

- Keep the contracts versioned. A new version goes under `src/vN/`, the HTTP prefix mirrors it, and the previous version keeps being served for the clients that are already installed.
- The response is a wrapper object, not a bare array, so that `meta` or `pagination` can be added later without changing the contract.
- The enforcement today is a compile-time one: the oRPC procedure types its response with the schema rather than attaching it as a runtime output schema.

The conventions of this package are in [AGENTS.md](AGENTS.md).
