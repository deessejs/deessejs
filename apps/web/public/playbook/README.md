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
   `next/image` in `hero.tsx`. Cropped tight to the book at
   829x1118 (0.742 portrait), transparent background. **Re-export
   it cropped to the artwork**: the original arrived in a 1500x1383
   frame whose transparent margin filled 47% of the width, which
   rendered the book at roughly half the size you asked for on
   screen. `hero.tsx` hardcodes `aspect-[829/1118]`; a new export
   with different bounds needs that ratio updated to match.

## Optional

3. **`preview/`** — directory of per-chapter preview images, one
   per TOC entry, if you want to surface previews on the
   landing page in addition to the cover.

Until the PDF lands, the page stays in draft mode. See
`apps/web/src/app/(marketing)/playbook/README.md` for the full
status checklist.
