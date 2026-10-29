# @workspace/email

## 0.1.0

### Minor Changes

- 3f40fd1: Add the `/playbook` lead-magnet landing page: single email field +
  optional consent checkbox + a `Resend Topic` subscription for
  future-marketing opt-in + transactional PDF email via the existing
  `mailer` singleton. Includes in-memory rate-limit and email-dedup
  primitives on the orpc side that mirror the existing Hono
  middleware. Funnel aliases `/ig`, `/x`, `/in` capture social-media
  clicks onto the same page.

  The consent checkbox subscribes the contact to a Resend Topic, which
  models a subscription preference. A Segment is for internal ranking
  and is not used. `RESEND_PLAYBOOK_TOPIC_ID` names the Topic and is
  required in production, so the checkbox cannot look like it works
  while recording nothing.

  The PDF deliverable is at `apps/web/public/playbook.pdf`, and the
  signup email links it at `<WEB_URL>/playbook.pdf`. The three funnel
  pages are force-dynamic and noindex so they never resolve to a stale
  redirect and search engines skip them.

  ## Operational prerequisites
  - `RESEND_PLAYBOOK_TOPIC_ID` must be set in every environment that
    serves production traffic. It is the id of a Resend Topic, created
    in the dashboard under Audience, Topics. The env schema rejects a
    missing value at startup in production, so this is a startup
    failure rather than a silent no-op.
  - The marketing emails go out as Broadcasts or Automations, which
    carry the Resend-managed unsubscribe footer. The PDF email points
    there, since a transactional send carries no unsubscribe link of
    its own.

### Patch Changes

- Updated dependencies [ac69a68]
- Updated dependencies [af040af]
- Updated dependencies [3f40fd1]
- Updated dependencies [0d0f793]
  - @workspace/env@0.1.0
