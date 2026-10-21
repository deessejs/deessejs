---
"@workspace/api": patch
"web": patch
---

Gives every catalog category a display label and allowlists the deployed template images.

`CATEGORY_LABELS` held `saas`, `ai` and `landing` while the registry uses seven categories, so
the intersection was `saas` alone. Six of the seven templates could not be reached through any
type filter, and `?type=ai` returned nothing even for `eve-starter`, whose curated labels
include `ai`. Six labels are added: `desktop`, `docs`, `marketing`, `content`, `library` and
`ai-agent`.

This is a visible correction, not a behavior-preserving change. The Type filter grows from three
options to nine. Seven of them now return their row; `ai` and `landing` stay at zero, because no
template's category is `ai` or `landing`, and `eve-starter`'s category is `ai-agent`, a separate
key. Both keys are kept: they are the public slugs of two type filters, and removing them would
change what the sidebar renders for no other reason.

Adds `packages/api/src/templates-images.ts`, the allowlist of the seven template images deployed
in `apps/web/public`, exported as the `@workspace/api/templates-images` subpath so a writer can
validate a submitted filename against the list without accepting a path.

`packages/api/tests/unit/category-maps.test.ts` pins the map against the registry and the
allowlist against the deployed files. `apps/web/tests/unit/template-category-filters.test.ts`
pins the filter itself, which moved out of the page into `apps/web/src/lib/template-filters.ts`
so it can be asserted on directly.
