---
name: mailer-audit
description: Decision log for the mailer implementation — Resend + console default + react-email, scoped to packages/email package
metadata:
  type: project
---

Decisions made 2026-07-07 during the mailer audit (full document at `temp/audit/mailer/mailer.md`):

| Decision | Choice |
|---|---|
| Provider (prod) | **Resend** |
| Dev transport default | **ConsoleTransport** (logs to stdout, zero infrastructure) |
| Dev transport opt-in | `MAIL_TRANSPORT=smtp` → SmtpTransport (nodemailer → Mailpit at localhost:1025) |
| Templates | **React Email** (`@react-email/components`) |
| Package location | **New `packages/email/` package** — owns transports + templates, deps on `resend` + `@react-email/components` |
| `packages/auth` deps on mailer | **Only via `@workspace/email`** — no direct `resend` or React Email imports |

**Why this matters:** The mailer was the first P0 to unlock the `organization` plugin (verifies existing broken `forgotPassword` and `verifyEmail` flows + enables `sendInvitationEmail`). Wiring it before the plugin avoids the drift between `packages/auth/src/index.ts` and `packages/auth/src/auth.config.ts`.

**How to apply:** When implementing the mailer wiring, follow the file tree in §8.1 of the audit document. Key entry points:
- `packages/email/src/transport.ts` — `MailerTransport` interface + `createMailer()` factory
- `packages/email/src/index.ts` — exports `sendAuthEmail()`, `templates`, types
- `packages/auth/src/index.ts` — imports from `@workspace/email`, calls in 3 callbacks
- `packages/auth/src/auth.config.ts` — CLI subset mirrors the same callbacks with noop stubs

Open questions still pending (see §14 of the doc): C (requireEmailVerificationOnInvitation), D (URL pattern), G (sender name env), H (idempotency key shape).

Related: [[package-structure]], [[packages-auth]], [[stack]].