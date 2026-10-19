# `/playbook` — lead-magnet landing page

> **Status: draft until the real PDF lands.**

This directory holds the `/playbook` route. The page is intentionally
shipped **as a draft PR**. It must not move out of draft until the
assets listed below are merged on top of the structural code:

## Assets still needed

1. **`apps/web/public/playbook/cover.{png|svg}`** — the cover
   thumbnail. Replace the "Cover — TODO" placeholder block in:
   - `apps/web/src/components/pages/playbook/hero.tsx`

2. **`apps/web/public/playbook/playbook.pdf`** — the actual PDF
   deliverable. Linked from the PlaybookDownload React Email
   template (`packages/email/src/templates/playbook.tsx`) via
   `WEB_URL/playbook.pdf`.

## Why the page is still draft

- The static PDF URL inside the email is `/playbook.pdf`. Until the
  file lands at that path, every transactional email delivers a
  404 link. We chose "wait for the real PDF" over "ship a stub" —
  the email promise and the email content must match.
- The cover thumbnail on the page is a labelled placeholder so
  readers can see what's coming without us pretending the asset
  exists.

## Reading order on the page

1. Hero (`Playbook.Hero`) — two-column: title, lead, form on the
   left; cover thumbnail on the right
2. Problem (`Playbook.Problem`)
3. What you'll find (`Playbook.WhatYouGet`)
4. Who it's for (`Playbook.WhoItsFor`)
5. Final CTA (`Playbook.FinalCta`) — closing 2-col block, mirrors
   the shared `FinalCtaShell` recipe used by /pricing and /about

## Pipeline (one-line reminders)

- `orpc.playbook.signup({ email, consentMarketing })` is the only
  mutation. Defined in `packages/api/src/orpc/routes/playbook.ts`.
- Privacy / GDPR copy is **single-sourced** in the email-checkbox
  field (`apps/web/src/components/pages/playbook/form.tsx`).
- Rate limit primitive lives at
  `packages/api/src/orpc/middleware/rate-limit.ts`.
- Audience contact add (when consent is true) lives at
  `packages/email/src/contacts.ts`.

## Toggling off the draft banner

Once the PDF + cover land:

1. Update the `Draft` notice at the top of this file.
2. Update the `metadata.description` in `page.tsx` if the real
   TOC surfaces a sharper two-line summary.
3. Re-run `pnpm --filter web test:e2e:local` against the preview
   deploy.
4. Convert the PR from draft to ready for review.
