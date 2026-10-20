# `/playbook`: lead-magnet landing page

> **Status: draft until the real PDF lands.**

This directory holds the `/playbook` route. The page is intentionally
shipped **as a draft PR**. It must not move out of draft until the
assets listed below are merged on top of the structural code:

## Assets still needed

1. **`apps/web/public/playbook/playbook.pdf`**: the actual PDF
   deliverable. Linked from the PlaybookDownload React Email
   template (`packages/email/src/templates/playbook.tsx`) via
   `WEB_URL/playbook.pdf`.

The cover thumbnail has landed at
`apps/web/public/playbook/cover.png` and is rendered by
`next/image` in `apps/web/src/components/pages/playbook/hero.tsx`.

## Why the page is still draft

- The static PDF URL inside the email is `/playbook.pdf`. Until the
  file lands at that path, every transactional email delivers a
  404 link. We chose "wait for the real PDF" over "ship a stub":
  the email promise and the email content must match.

## Reading order on the page

## Reading order on the page

1. Hero (`Playbook.Hero`): two columns: H1, lead, and the signup
   form on the left; the cover mockup on the right
2. Reading (`Playbook.Reading`): the three most recent blog posts
3. Final CTA (`Playbook.FinalCta`): the shared closing block, the
   same copy and actions as the homepage

The Problem, What you'll find, and Who it's for were deleted along
with `content/toc.ts`, the chapter list that fed the third of them.
Their copy is intact in git history and the components README
records what each one contained.

With the FinalCta gone the page carries a single form, so the two
instances that shared hardcoded ids (the second checkbox scrolled
the visitor back to the first) are no longer possible. `form.tsx`
still derives its ids from `useId` so a second mount stays safe.

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

Once the PDF lands:

1. Update the `Draft` notice at the top of this file.
2. Update the `metadata.description` in `page.tsx` if the real
   cover copy suggests a sharper two-line summary.
3. Re-run `pnpm --filter web test:e2e:local` against the preview
   deploy.
4. Convert the PR from draft to ready for review.
