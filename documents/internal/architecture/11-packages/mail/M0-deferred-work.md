# `packages/mail` — M0 deferred work (must ship before M2 / billing emails)

Gaps identified during the M0 / Sprint 1 review of `packages/mail` (2026-06-22). The package ships in M1 with the 6 Better Auth templates wired and the Resend provider active. The items below are **NOT bugs in M1** — they are work that the architecture recommends but that the Sprint 1 implementation defers to keep the M1 surface minimal.

**None of these block the M1 deploy** of password reset / OTP / magic link. They become blocking only when we wire billing emails (Stripe webhooks → `sendMail`) or expose transactional notifications to end users.

---

## 1. Resend webhooks — bounce / complaint / open tracking

**Severity**: Operational (deliverability). No code crash, but bounces go undetected and the buyer dashboard shows false-positive delivery rates.

**Problem**: `packages/mail` calls `resend.emails.send(...)` and returns. We never register a webhook handler for the events Resend sends back:

- **`email.bounced`** — recipient address is invalid. Future sends to this address are wasted (and can hurt sender reputation).
- **`email.complained`** — recipient marked the message as spam. Must suppress future sends to comply with anti-spam regulations.
- **`email.opened` / `email.clicked`** — optional engagement analytics (the buyer may want this for marketing templates).

**Fix**:

1. Mount a Hono route in `packages/api` at `/api/resend/webhook` (signature-verified via `RESEND_WEBHOOK_SECRET`).
2. On `email.bounced` and `email.complained`, write to a new `email_suppressions` table in `packages/database` (or add it to the auth schema).
3. In `ResendMailer.send()`, before sending, check the suppression table and short-circuit with `{ id: 'suppressed' }`.
4. On `email.opened` / `email.clicked`, write to an `email_events` table (buyer enables this in config).

**Estimated effort**: 1-2 days + the new `email_suppressions` migration.

**Why now**: every bounced email costs the buyer money and sender reputation. The longer we wait, the worse the damage.

---

## 2. i18n — locale-aware templates

**Severity**: UX (non-English buyers). All templates ship hardcoded English.

**Problem**: React Email has first-class integrations for `next-intl`, `react-i18next`, and `react-intl` (verified 2026-06-22 via the react.email docs). DeesseJS's `packages/i18n` package is currently empty — there is no message catalog to translate against.

**Fix**:

1. When `packages/i18n` ships (M2), each template takes `locale` + `translations` props (per supastarter's `BaseMailProps = { locale, translations }` pattern).
2. Move all copy from JSX to `mail.<namespace>.json` message files.
3. The `sendMail()` API gets a new optional `locale` field; the resolver picks the right template variant.

**Estimated effort**: 1 day once `packages/i18n` exists. We are blocked on `packages/i18n`.

**Why deferred**: writing translations without a working `packages/i18n` is wasted work. The templates ship in English for M1, get translated in M2.

---

## 3. Plain-text fallback for HTML-disabled clients

**Severity**: Accessibility + deliverability.

**Problem**: Some recipients disable HTML email (security, accessibility). Currently we only send the React component (which Resend renders to HTML). The plain-text version is `null` on the wire — those recipients see an empty message.

**Fix**:

1. In `send.ts`, after `provider.send()`, also call `toPlainText(await render(<Template />))` and pass as `text:` field.
2. Add `tests/render.test.ts` to assert `toPlainText(html)` is non-empty for every template.

**Estimated effort**: 2 hours.

**Why deferred**: M1 has zero confirmed users who need this. The 4 Better Auth triggers are all link-based — the link is in the HTML, the user clicks it. Plain-text fallback is a "nice to have" until we have evidence of HTML-disabled recipients.

---

## 4. Per-category unsubscribe

**Severity**: Compliance (CAN-SPAM, GDPR). M1 has no unsubscribe mechanism at all.

**Problem**: Marketing and notification emails must offer a per-category unsubscribe link (per spec 5.9, 5.10). The auth-related emails (password reset, verify, magic link, OTP) do NOT need unsubscribe — they are transactional.

**Fix**:

1. Each template (except the 4 auth ones) gets an `unsubscribeUrl` prop.
2. The Wrapper renders the unsubscribe link in the footer for non-auth templates.
3. Add `POST /api/unsubscribe` route to handle the click.

**Estimated effort**: 1 day, plus a `subscription_preferences` table in the database.

**Why deferred**: M1 is 100% auth transactional. No marketing or notification emails. Compliance gap is zero today.

---

## 5. Rate-limit on `sendMail`

**Severity**: Cost protection. Not security.

**Problem**: There is no rate limit on `sendMail()` itself. A misbehaving caller could burn through Resend's 5 req/sec limit and trigger 429s.

**Fix**:

1. Add a token-bucket in `packages/cache` (Upstash Redis) keyed on `key.apiKeyRateLimit(...)` or a new `key.mailerRateLimit(...)`.
2. `sendMail()` checks the bucket before dispatching. Returns `{ error: 'rate_limited' }` if exceeded.

**Estimated effort**: 4 hours (mirrors the existing rate-limit middleware in `packages/api`).

**Why deferred**: The 4 Better Auth hooks are triggered by user actions (not bulk sends). The probability of hitting the 5 req/sec limit from auth alone is near zero. Billing emails (M2) are the higher-volume consumer and will need this.

---

## 6. Attachment support (invoices, receipts)

**Severity**: Feature gap, not blocking.

**Problem**: Resend supports attachments (PDF invoices, CSV exports). `Mailer.send()` does not.

**Fix**: Add `attachments?: Attachment[]` to `MailerSendInput` and `SendMailInput`.

**Estimated effort**: 1 hour.

**Why deferred**: No consumer needs attachments in M1.

---

## Summary

| # | Item | Severity | Blocks | Effort |
|---|---|---|---|---|
| 1 | Resend webhooks (bounce/complaint/opens) | High (deliverability) | M2 (billing mails) | 1-2 days |
| 2 | i18n | Medium (UX) | M2 (after `packages/i18n`) | 1 day |
| 3 | Plain-text fallback | Low (accessibility) | None yet | 2 hours |
| 4 | Per-category unsubscribe | High (compliance) | M2 (marketing) | 1 day |
| 5 | Rate-limit `sendMail` | Medium (cost) | M2 (bulk sends) | 4 hours |
| 6 | Attachments | Low (feature gap) | None yet | 1 hour |

**Total deferred work**: ~4-5 days, all deferred to M2 or later.

**Why this doc exists**: same reason as `auth/M0-deferred-work.md` — so a future contributor or buyer doesn't re-debate "why doesn't the template have an unsubscribe link" / "why don't bounces suppress". The answer is "because we deferred it; here's the plan to fix it".
