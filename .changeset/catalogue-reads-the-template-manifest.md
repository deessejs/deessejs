---
"@workspace/api": minor
---

The templates catalogue reads the template manifest instead of keeping a second copy of the product fields.

- `packages/api/src/templates.ts` is now a list of pointers. Each entry names the `owner/repo` of a template and nothing else. The slug, the title, the description, the licence, the category, the labels, the image and the layer come from `deesse-template.json`, read live from the repository by the new `fetchManifest` in `packages/api/src/core/github/client.ts`.
- `packages/api/src/core/templates/manifest.ts` is the new contract module. It parses the manifest, resolves the labels and merges the manifest with the live repository facts. A malformed manifest never throws, it returns `undefined` and the template is skipped.
- `packages/api/src/core/templates/enrich.ts` reads the manifest next to the repository metadata and the readme, and logs a `template_manifest_unreadable` or a `template_manifest_incomplete` error when a template is skipped. A skipped template does not fail the endpoint.
- The wire contract `TemplateV1` is unchanged. Installed CLI V1 clients and the marketing site keep parsing the same shape. The `layer` field stays optional and now comes from the manifest.

The product fields of a template change in one place, the manifest of the template repository. The catalogue, the filter chips and the install path follow.

Merge order: the template repositories must carry their manifest before this change lands. A template without a manifest is not listed.
