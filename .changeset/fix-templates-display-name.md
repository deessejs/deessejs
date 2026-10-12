---
"@workspace/api": patch
---

Fixes the templates catalog display name on `/templates` so the registry's editorial name is rendered instead of GitHub's slugified repo name.

- `packages/api/src/core/templates/enrich.ts` no longer overwrites `template.name` with `repo.name` on enrichment. The registry is the editorial source of truth for the display name (`SaaS Starter`, `Electron Starter`, `Docs Starter`, `Landing Starter`, `Blog Starter`, `Package Starter`, `Eve Starter`); GitHub provides only live metadata (stars, updatedAt, readme, license, topics). The previous behaviour surfaced GitHub slugs like `saas-template` and `complete-electron-template` in the catalog cards.
- `packages/api/tests/unit/enrich-display-name.test.ts` pins the invariant: when `fetchRepo` returns a `name` different from the registry's `name`, the enriched payload must keep the registry's name. Covers every shipped entry plus the symmetric description-fallback case.

No consumer of the templates procedure is required to update. The wire shape `TemplateV1.name` is unchanged.
