---
"@deessejs/cli": patch
---

Reposition discoverability metadata: replace the `saas-template` npm keyword with `deessejs-main-app` to match the repo's new identity. No behavior change, no API change, no runtime impact — search-engine metadata only.

This is one of several commits shipping under the `chore(brand):` theme to reposition this repo as the DeesseJS main app (see `docs/engineering/plans/deessejs-main-app-repositioning.md`). The keyword change is isolated to `apps/cli/package.json`; the package name (`@deessejs/cli`) and `repository.url` were already aligned with the new identity.
