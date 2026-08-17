---
"@deessejs/cli": patch
---

`npx @deessejs/cli@latest` was failing on install because the published `package.json` listed `@workspace/api` in `dependencies`. The `@workspace/*` packages are workspace-only — they are not published to npm — so npm's resolver could not find `@workspace/api@0.0.2` and aborted the install before the bundle was even loaded.

What's in this patch:

- `apps/cli/package.json` drops `@workspace/api: workspace:*` from `dependencies`. The package is no longer needed at install time. It stays accessible to tsc via the dev-time workspace protocol (the dependency is still resolvable through pnpm's link in `node_modules`), and the bundle is unaffected: tsup's `noExternal: [/^@workspace\//]` already inlines `@workspace/api`'s code into `dist/index.js`, so the published bundle remains self-contained.
- `apps/cli/package.json` switches `prebuild`, `predev`, and `pretest` from `pnpm --filter ... build` to `pnpm turbo build --filter=@deessejs/cli --force`. `pnpm --filter` does not follow transitive workspace deps, so the previous chain (`@workspace/contracts` + `@workspace/api`) failed to build `@workspace/api`'s own deps (`@workspace/auth`, `@workspace/database`, `@workspace/env/server`). Turbo's `dependsOn: ["^build"]` resolves the full topological order. Without this, the CLI's prebuild step fails with TS2307 `Cannot find module '@workspace/auth'`.
- `pnpm-lock.yaml` syncs the corresponding importer block (3 lines removed).

No behavior change at runtime — the bundle was already inlining `@workspace/api`. The fix is to make the published `package.json` honest about what is and isn't a runtime install-time dependency, and to make the local build chain propagate transitively.
