---
"@deessejs/cli": patch
---

Sync `CLI_PACKAGE_VERSION` in `apps/cli/src/api/self-version.ts` to `2.0.1` to match the bumped `apps/cli/package.json#version`.

The `cli-self-version.test.ts` drift check fails when these two diverge. The orphan 2.0.1 release commit (from the workflow that did not push back to main) bumped the package.json without touching the constant. This changeset fixes the constant alongside the absorption of the orphan commit onto main.
