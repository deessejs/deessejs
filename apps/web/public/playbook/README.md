# `/playbook/public/` — lead-magnet asset drop zone

> **Status: cover landed, PDF pending. Page stays draft.**

This folder holds the public assets for the `/playbook` lead-magnet
page. The page is **draft** until the PDF lands:

## Required

1. **`playbook.pdf`** — the actual PDF deliverable. Linked from the
   PlaybookDownload React Email template
   (`packages/email/src/templates/playbook.tsx`) at the canonical
   URL `<WEB_URL>/playbook.pdf`.

2. **`cover.png`** — the cover thumbnail. Landed, and rendered by
   `next/image` in `hero.tsx`. 1500x1383, transparent background,
   served exactly as exported. Its transparent margin holds 47% of
   the width, so `hero.tsx` crops to the 797x1086 artwork region
   in CSS rather than resampling the file. If the cover is
   re-exported at different bounds, re-measure that region and
   update `COVER` in `hero.tsx`.

## Optional

3. **`preview/`** — directory of per-chapter preview images, one
   per TOC entry, if you want to surface previews on the
   landing page in addition to the cover.

Until the PDF lands, the page stays in draft mode. See
`apps/web/src/app/(marketing)/playbook/README.md` for the full
status checklist.
