---
"@workspace/api": minor
---

Adds 7 new entries to the templates registry in `packages/api/src/templates.ts`, expanding the catalog returned by `GET /api/v1/templates` from 1 entry to 8.

New entries:

- `saas-starter-multi-tenant` → `deessejs/saas-template-multi-tenant`
- `electron-starter` → `deessejs/complete-electron-template`
- `docs-starter` → `deessejs/documentation-template`
- `landing-starter` → `deessejs/landing-template`
- `blog-starter` → `deessejs/blog-template`
- `package-starter` → `deessejs/package-template`
- `eve-starter` → `deessejs/eve-template`

Each entry uses GitHub's canonical `description` when present and a curated editorial fallback otherwise (for repos whose GitHub description is empty). All `layer` values are `open-community` for now; re-classification is a marketing/business decision tracked outside this PR.

`cli-template` (private) and `pro-template` (private) are intentionally excluded from this PR. The first needs a verified `GITHUB_TOKEN` with read access to private repos; the second needs its visibility/description sorted out before it can ship.

No breaking change for installed CLI V1 clients: the wire format (`TemplateV1`) is unchanged, only the count of items in the array changes. Apps that iterate the array are unaffected.
