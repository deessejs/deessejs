# `/playbook/public/` — lead-magnet asset drop zone

> **Status: empty until the assets ship.**

This folder holds the public assets for the `/playbook` lead-magnet
page. The page is **draft** until at least these two files land:

## Required

1. **`playbook.pdf`** — the actual PDF deliverable. Linked from the
   PlaybookDownload React Email template
   (`packages/email/src/templates/playbook.tsx`) at the canonical
   URL `<WEB_URL>/playbook.pdf`.

2. **`cover.{png|svg}`** — the cover thumbnail. Used as the
   `<img>` / `next/image` source in `hero.tsx` and `preview.tsx`
   (replace the labelled "Cover — TODO" placeholder blocks).

## Optional

3. **`preview/`** — directory of per-chapter preview images, one
   per TOC entry, if you want to surface previews on the
   landing page in addition to the cover.

Until these land, the page stays in draft mode. See
`apps/web/src/app/(marketing)/playbook/README.md` for the full
status checklist.
