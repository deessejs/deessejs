---
"@deessejs/cli": patch
---

`npx @deessejs/cli@latest` was failing on install because the published `package.json` listed `@workspace/api` in `dependencies`. The `@workspace/*` packages are workspace-only — they are not published to npm — so npm's resolver could not find `@workspace/api@0.0.2` and aborted the install before the bundle was even loaded.

What's in this patch:

- `apps/cli/package.json` drops `@workspace/api: workspace:*` from `dependencies`. The package is no longer needed at install time. It stays accessible to tsc via the dev-time workspace protocol (the dependency is still resolvable through pnpm's link in `node_modules`), and the bundle is unaffected: tsup's `noExternal: [/^@workspace\//]` already inlines `@workspace/api`'s code into `dist/index.js`, so the published bundle remains self-contained.
- `apps/cli/package.json` extends `prebuild`, `predev`, and `pretest` to also build `@workspace/api`. The prebuild chain used to build only `@workspace/contracts`, but the oRPC migration added `@workspace/api/base-path` and `@workspace/api/router` imports to the CLI source, and `tsup` cannot resolve a subpath export like `@workspace/api/base-path` (which points to `dist/constants/base-path.js`) unless `@workspace/api` has been built. Building `@workspace/api` first is required for `tsup` to find the file on disk.
- `pnpm-lock.yaml` syncs the corresponding importer block (3 lines removed).

No behavior change at runtime — the bundle was already inlining `@workspace/api`. The fix is to make the published `package.json` honest about what is and isn't a runtime install-time dependency.
