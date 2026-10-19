# `/playbook` — lead-magnet landing page

> **Status: draft until the real PDF lands.**

This directory holds the `/playbook` route. The page is intentionally
shipped **as a draft PR**. It must not move out of draft until the
assets and copy listed below are merged on top of the structural code:

## Assets still needed

1. **`apps/web/public/playbook/cover.{png|svg}`** — the cover
   thumbnail. Replace the "Cover — TODO" placeholder blocks in:
   - `apps/web/src/components/pages/playbook/hero.tsx`
   - `apps/web/src/components/pages/playbook/preview.tsx`

2. **`apps/web/public/playbook/playbook.pdf`** — the actual PDF
   deliverable. Linked from the PlaybookDownload React Email
   template (`packages/email/src/templates/playbook.tsx`) via
   `WEB_URL/playbook.pdf`.

3. **Author bio** — `apps/web/src/components/pages/playbook/about-the-author.tsx`
   has a `[Author bio — TODO]` placeholder that needs to be replaced
   with the real first-person paragraph (target: three short
   sentences).

## Why the page is still draft

- The static PDF URL inside the email is `/playbook.pdf`. Until the
  file lands at that path, every transactional email delivers a
  404 link. We chose "wait for the real PDF" over "ship a stub" —
  the email promise and the email content must match.
- The cover thumbnail on the page is a labelled placeholder so
  readers can see what's coming without us pretending the asset
  exists.
- The author bio is the smallest piece but most personal — kept
  honest until the working paragraph is finalised.

## Reading order on the page

1. Hero (`Playbook.Hero`) — H1, lead, cover, form
2. Problem (`Playbook.Problem`)
3. What you'll find (`Playbook.WhatYouGet`)
4. Preview (`Playbook.Preview`) — cover + TOC card
5. Who it's for (`Playbook.WhoItsFor`)
6. Why I wrote it (`Playbook.AboutTheAuthor`)
7. Final CTA (`Playbook.FinalCta`) — repeated form + expectations
8. Read next (`RelatedLinks`) — `/stack`, `/pricing`, `/customers`

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

Once the PDF + cover + author bio land:

1. Remove the `Draft` notice at the top of this file.
2. Update the `metadata.description` in `page.tsx` if the real
   TOC surfaces a sharper two-line summary.
3. Re-run `pnpm --filter web test:e2e:local` against the preview
   deploy.
4. Convert the PR from draft to ready for review.
