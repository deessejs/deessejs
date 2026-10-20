# `/playbook`: lead-magnet landing page

> **Status: the PDF has landed. The page can leave draft.**

This directory holds the `/playbook` route. The page was shipped
**as a draft PR** until the real PDF deliverable was in the repo, so
that the email promise and the email content would match: a signup
never delivered a 404 link.

## Assets

1. **`apps/web/public/playbook.pdf`**: the actual PDF deliverable.
   Linked from the PlaybookDownload React Email template
   (`packages/email/src/templates/playbook.tsx`) via
   `WEB_URL/playbook.pdf`.

   The file sits at the root of `public/`, not inside
   `public/playbook/`, because Next serves `public/` at the root.
   A file at `public/playbook/playbook.pdf` is served from
   `/playbook/playbook.pdf`, while the email points at
   `/playbook.pdf`. The two are different URLs, and the email is the
   one that has to be stable.

2. **`apps/web/public/playbook/cover.png`**: the cover thumbnail.
   Rendered by `next/image` in
   `apps/web/src/components/pages/playbook/hero.tsx`.

## Reading order on the page

## Reading order on the page

1. Hero (`Playbook.Hero`): two columns: H1, lead, and the signup
   form on the left; the cover mockup on the right
2. TechStack (`Playbook.TechStack`): the rotating logo wall
3. Reading (`Playbook.Reading`): the three most recent blog posts
4. FAQ (`Playbook.FAQ`): accordion, enterprise 2-col layout
5. Final CTA (`Playbook.FinalCta`): the shared closing block, the
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
- Topic subscription (when consent is true) lives at
  `packages/email/src/contacts.ts`.

## Resend setup (production)

Two things exist in the Resend account, and one of them does not.

1. **A Topic**, e.g. "DeesseJS updates". Create it in the dashboard
   under Audience, Topics, then set its id in
   `RESEND_PLAYBOOK_TOPIC_ID`. The env var is **required in
   production**: the schema rejects a missing value at startup, so
   the consent checkbox cannot look functional while recording
   nothing. In dev it is optional and the subscription is skipped with
   a warning.

2. **No contact property.** The signup sends no `properties` in the
   Resend payload, and none has to be created. Resend only accepts a
   value for a property that was declared in the account first, and
   an undeclared property fails the whole call. The signup handler
   treats a failure as best-effort, so the symptom would be a consent
   checkbox reporting success while recording nothing. The Topic
   subscription already records where the opt-in came from. A second
   signup surface gets its own Topic.

The PDF email is sent through the transactional API, where Resend does
not manage subscriptions. The unsubscribe link lives in the marketing
emails, which go out as Broadcasts or Automations and carry the
Resend-managed footer. The email copy points there, not at itself.

## Toggling off the draft banner

The PDF has landed, so the gate is open. What is left before the PR
leaves draft:

1. Set `RESEND_PLAYBOOK_TOPIC_ID` in production (see above).
2. Update the `metadata.description` in `page.tsx` if the real
   cover copy suggests a sharper two-line summary.
3. Re-run `pnpm --filter web test:e2e:local` against the preview
   deploy.
4. Convert the PR from draft to ready for review.
