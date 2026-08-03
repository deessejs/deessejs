---
"@deessejs/cli": patch
---

Hotfix release: ship the compiled CLI bundle and correct the upgrade hint.

What's in this patch:

- The release workflow (`.github/workflows/release.yml`) now runs
  `pnpm build` for publishable packages (`@deessejs/cli`,
  `@workspace/contracts`) between the version bump and the
  `pnpm changeset publish` step. The 1.1.0 release shipped without
  the `dist/` directory in the published tarball, so `npx
  @deessejs/cli` and `pnpm dlx @deessejs/cli` both failed with
  "'deessejs' is not recognized" — the bin target pointed at a
  file that didn't exist in the package.
- The version-check warning (`apps/cli/src/version-check.ts`) now
  prints `pnpm dlx @deessejs/cli@latest` instead of `pnpm dlx
  deessejs@latest`. The unscoped `deessejs` name on npm belongs to
  an unrelated package, so the old hint pointed users at the
  wrong install command.

No functional change to CLI behavior. The bundle is now included
in the tarball, and the upgrade message points at the correct
package.