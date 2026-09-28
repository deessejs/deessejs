# /r/* — DeesseJS shadcn registry

Public read-only registry exposed by `apps/web` so consumers can
install DeesseJS components and blocks into their own Next.js
projects via the [shadcn CLI](https://ui.shadcn.com/docs/cli).

## Endpoints

| Path | Description |
|---|---|
| `GET /r/registry.json` | Catalogue index. Each entry is a full shadcn RegistryItem — `name`, `type`, `title`, `description`, `dependencies`, `registryDependencies`, `files`. Used by `shadcn list` / `search`. |
| `GET /r/<name>.json` | Single-item resolver. `<name>` is the flat slug (e.g. `button`, `input`, `badge`). Returns the matching RegistryItem. |

Note: the route is a single-segment dynamic (`/[name].json`), not
nested. The `components/button` / `blocks/<slug>` namespace lives
on the consumer's `components.json` — the shadcn CLI rewrites
`@deessejs/button` to `/r/button.json` on the consumer side.

Currently shipped:

- Components: `button`, `input`, `badge`.
- Blocks: none. The `/blocks` catalogue is documented but no items are wired into the registry yet.

## Consumer setup

A consumer project must declare the `@deessejs` namespace once in
its `components.json` before running `npx shadcn add`. The
schema for `components.json` is the top-level shadcn config
schema, not the registry-item schema:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "registries": {
    "@deessejs": "https://deessejs.com/r/{name}.json"
  }
}
```

Then, from the consumer's project root:

```bash
# Discover what's available
npx shadcn list @deessejs

# View the item before installing
npx shadcn view @deessejs/button

# Install it (copies source + installs declared dependencies)
npx shadcn add @deessejs/button
```

## Item shape

Each item is a standard shadcn `registry:ui` (single-file) or
`registry:block` (multi-file) object. The `files[].target` field
uses `@/components/ui/<name>` as the destination in the consumer
project — adjust to match the consumer's `components.json`
aliases if they have renamed `@/`.

`dependencies` lists npm packages the consumer needs; the CLI runs
`npm install` for these. `registryDependencies` lists other
`@deessejs/<x>` items that must be installed first.

## Roadmap

- Move `/blocks` from V1 placeholder snippets to real
  `registry:block` items as the marketing pages stabilise.
- Wire the remaining 12 component slugs from
  `apps/web/src/components/catalog/data/` into
  `packages/ui/src/components/` so they can be added to
  `apps/web/src/registry/items.ts`.
