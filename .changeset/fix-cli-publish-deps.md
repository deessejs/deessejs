---
"@deessejs/cli": patch
---

`npx @deessejs/cli@latest` was failing on install because the published `package.json` listed two kinds of unresolvable dependencies:

1. `@workspace/api: workspace:*` — the `@workspace/*` packages are workspace-only and never published to npm.
2. `@orpc/client: catalog:` and `@orpc/server: catalog:` — the `catalog:` protocol is pnpm-specific; `npm install` does not understand it and aborts with `EUNSUPPORTEDPROTOCOL`.

What's in this patch:

- `apps/cli/package.json` drops `@workspace/api: workspace:*` from `dependencies`. The package is no longer needed at install time. It stays accessible to tsc via the dev-time workspace protocol (the dependency is still resolvable through pnpm's link in `node_modules`), and the bundle is unaffected: tsup's `noExternal: [/^@workspace\//]` already inlines `@workspace/api`'s code into `dist/index.js`, so the published bundle remains self-contained.
- `apps/cli/package.json` adds `@workspace/api: workspace:*` to `devDependencies`. The TypeScript compiler and `tsup` need the package's source files and types in `node_modules` to resolve `@workspace/api/router` and `@workspace/api/base-path`. `devDependencies` is the right home: it is a build-time and typecheck-time dependency, never a runtime install-time one.
- `apps/cli/package.json` replaces `@orpc/client: catalog:` and `@orpc/server: catalog:` with `^1.14.7` in `dependencies`. These are real npm packages (not workspace), used at runtime by the CLI (the RPCLink code calls them), so they must be published as real semver. `devDependencies` may keep `catalog:` because devDeps are not installed in production.
- `prebuild`/`predev` continue to build only `@workspace/contracts` directly via `pnpm --filter`. The CI's global `pnpm turbo build --force` already builds the full dependency graph topologically; the prebuild's job is just to ensure transitive deps exist for local `pnpm dev`.
- `pnpm-lock.yaml` syncs the corresponding importer blocks.

No behavior change at runtime — the bundle is already inlining `@workspace/api` and the catalog internal dependencies are unchanged. The fix is to make the published `package.json` honest about what is and isn't a runtime install-time dependency, and to keep build-time deps resolvable through the dev-time workspace protocol.
