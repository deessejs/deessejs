---
"web": minor
"email": minor
"api": minor
"env": minor
---

Add the `/playbook` lead-magnet landing page: single email field +
optional consent checkbox + a `Resend Audiences` contact for
future-marketing opt-in + transactional PDF email via the existing
`mailer` singleton. Includes in-memory rate-limit and email-dedup
primitives on the orpc side that mirror the existing Hono
middleware. Funnel aliases `/ig`, `/x`, `/in` capture social-media
clicks onto the same page.

The page is **draft** until the real PDF is added to
`apps/web/public/playbook/playbook.pdf`; the email link to the PDF
will 404 until then. The three funnel pages are force-dynamic and
noindex so they never resolve to a stale redirect and search
engines skip them.
