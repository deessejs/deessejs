# `/playbook/public/`: lead-magnet asset drop zone

> **Status: cover and PDF landed.**

This folder holds the public assets for the `/playbook` lead-magnet
page that are addressed under the `/playbook/` path.

The PDF is **not** in this folder. It sits one level up, at
`apps/web/public/playbook.pdf`, because the email links it at
`<WEB_URL>/playbook.pdf` and Next serves `public/` at the root. A
file at `public/playbook/playbook.pdf` would be served from
`/playbook/playbook.pdf`, which is a different URL, and the one in
the email is the one that has to be stable.

## Landed

1. **`cover.png`**: the cover thumbnail. Rendered by `next/image` in
   `hero.tsx`. 1500x1383, transparent background, served exactly as
   exported. Its transparent margin holds 47% of the width, so
   `hero.tsx` crops to the 797x1086 artwork region in CSS rather than
   resampling the file. If the cover is re-exported at different
   bounds, re-measure that region and update `COVER` in `hero.tsx`.

2. **`../playbook.pdf`**: the actual PDF deliverable, linked from the
   PlaybookDownload React Email template
   (`packages/email/src/templates/playbook.tsx`) at the canonical
   URL `<WEB_URL>/playbook.pdf`.

## Optional

3. **`preview/`**: directory of per-chapter preview images, one
   per TOC entry, if you want to surface previews on the
   landing page in addition to the cover.

See `apps/web/src/app/(marketing)/playbook/README.md` for the full
status checklist.
