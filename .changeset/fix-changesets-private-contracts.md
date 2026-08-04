---
"@deessejs/cli": patch
---

Mark `@workspace/contracts` as private so the release workflow stops trying to publish it.

What's in this patch:

- `packages/contracts/package.json` reverts to `"private": true`. Earlier attempts at the same fix marked it `private: false` to satisfy Changesets' versioned-dependency check (because `@deessejs/cli` used to list it as a runtime dependency). With that dependency moved to `devDependencies` (PR #20), Changesets no longer needs the workaround and respects `private: true` as the canonical signal for 'never publish this package'.
- The previous attempts to fix this resulted in `pnpm changeset publish` trying to `PUT @workspace/contracts@0.0.1` to the public npm registry, which 404'd. With `private: true`, Changesets skips the package entirely on publish.
- `apps/cli/src/cli-self-version.ts` is bumped from `1.1.0` to `1.1.1` to match the new `apps/cli/package.json` version (kept in sync by the drift check test).

After this release, `npx @deessejs/cli@latest --version` should return `1.1.1` and the install should complete without any 404.