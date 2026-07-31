---
name: apps-cli-publish-readiness
description: apps/cli package.json and tsup config have multiple gaps that block npm publishing even with private:true flipped. Preconditions for the publish PR.
metadata:
  type: project
---

As of 2026-07-31, `apps/cli/package.json` is missing several fields required to publish to npm with trusted publishing. The 2026-07-31 audit (`docs/engineering/reports/versioning-strategy-audit-2026-07-30.md`) lists these as preconditions for the publish PR.

Missing fields (all verified):

- `license` — README says `UNLICENSED for V1`; npm refuses unlicensed. Recommended: MIT (matches upstream saas-template).
- `repository` — required by npm trusted publishers; the trusted publisher config on npmjs.com rejects the workflow run if `repository.url` doesn't match the GitHub repo configured.
- `keywords` — discoverability on npm.
- `types` — no `dist/index.d.ts` is emitted today because tsup config has `dts: false`. Add `dts: true` to `tsup.config.ts` and add `types: "./dist/index.d.ts"` to package.json.
- `module` — optional but conventional; current `main` works for ESM with `"type": "module"` but bundlers that prefer `module` need it explicit.

**Why:** These are easy to overlook because the local build (tsup) doesn't need them. They only matter at publish time. The audit's recommended PR 1 lists them all.

**How to apply:** Before opening the publish PR, run a quick check: `node -e "const p = require('./apps/cli/package.json'); ['license','repository','keywords','types'].forEach(k => console.log(k, ':', p[k] ?? 'MISSING'))"` — all four must be present. The `private: true` → `false` flip is a separate concern and is gated on this check.