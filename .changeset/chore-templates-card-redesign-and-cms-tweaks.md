---
"@workspace/api": patch
"@workspace/contracts": patch
"@deessejs/web": patch
---

Redesign the templates index cards (rotated hero image, latest-guides vocabulary) and remove `saas-starter-multi-tenant` from the registry while it is being stabilised.

- `@workspace/contracts`: adds an optional `image` field to `TemplateV1`. The field is `string | undefined`, so existing clients continue to parse without change.
- `@workspace/api`: declares the seven remaining templates' cover images in the static registry. The `enrich` step spreads `...entry`, so `image` propagates automatically. `saas-starter-multi-tenant` is removed.
- `@deessejs/web`: `templates/page.tsx` stylises the "Ship your template" CTA (transparent background, top border only, no radius). `templates/template-card.tsx` and `templates/template-detail.tsx` consume `template.image` and render the hero with the same `-rotate-3 origin-bottom-right translate-x-[10%] translate-y-[10%]` chrome as the homepage latest-guides carousel. Homepage coding-agents h2 used `lg:text-heading-48` (one step above the rest of the homepage) — now aligned at `lg:text-heading-40`.
