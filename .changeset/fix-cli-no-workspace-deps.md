---
"@deessejs/cli": patch
---

Hotfix release: bundle `@workspace/contracts` into the CLI so installs stop 404'ing.

What's in this patch:

- The CLI's published tarball previously listed `@workspace/contracts`
  as a runtime dependency, but `@workspace/*` packages are workspace-only
  and never published to npm. `npx @deessejs/cli@1.1.1` would install
  the tarball successfully but then fail with `404 Not Found - GET
  https://registry.npmjs.org/@workspace%2fcontracts` when npm tried
  to resolve that dependency. The CLI itself was unused because the
  install errored out.
- `apps/cli/tsup.config.ts` now sets `noExternal: [/^@workspace\//]`,
  which tells tsup to inline any `@workspace/*` import into
  `dist/index.js` at build time instead of leaving an `import` that
  would need to resolve at runtime.
- `apps/cli/package.json` moves `@workspace/contracts` from
  `dependencies` to `devDependencies`. The package is still consumed
  in the monorepo via the workspace protocol (dev-time), but it
  no longer appears in the published `package.json` (consumer-time).

Trade-off: the CLI's bundle now contains an inlined snapshot of
`@workspace/contracts`. A contract change requires a CLI re-bundle
+ re-publish. This is the standard pattern for Zod-based libraries
that ship contracts internally (tRPC, etc.).

Verification:
- `pnpm --filter @deessejs/cli build` produces `dist/index.js` (551 KB).
- `grep "@workspace" apps/cli/dist/index.js` returns 0 matches
  (the import is fully inlined).
- `grep -c "TemplatesListResponseV1" apps/cli/dist/index.js` returns
  2 occurrences (the schema definition + its runtime usage).
- `pnpm --filter @deessejs/cli test`: 53/53 green.
- `pnpm --filter @deessejs/cli lint`: clean.
- `pnpm --filter @deessejs/cli typecheck`: clean.

After this release, `npx @deessejs/cli@latest --version` should
return `1.1.2` and the install should succeed without any 404.