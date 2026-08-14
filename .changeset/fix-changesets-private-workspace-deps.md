---
"@deessejs/cli": patch
---

Unblock the release workflow. Changesets has been failing at `pnpm changeset version` since the oRPC migration added `@workspace/api` and `@workspace/contracts` as dependencies of the published CLI; Changesets refuses to bump a package that depends on a skipped package.

What's in this patch:

- `.changeset/config.json` flips `privatePackages` from `{ version: false, tag: false }` to `{ version: true, tag: false }`. Private workspace packages are now versioned (so the dependency graph stays consistent) but never tagged or published. Implements ADR-012.
- `apps/cli/package.json` drops the duplicate `@workspace/contracts` entry from `dependencies`. The package stays in `devDependencies` for typecheck; runtime code is still inlined by tsup via `noExternal: [/^@workspace\//]`.

No behavior change at runtime. The next release workflow run after this lands on `main` will bump the CLI to `2.0.1` and publish it on npm.
