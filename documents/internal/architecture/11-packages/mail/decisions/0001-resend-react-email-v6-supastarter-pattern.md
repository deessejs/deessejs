# 0001. `packages/mail` adopts Resend + react-email v6 unified + supastarter's pattern

- **Status:** Accepted
- **Date:** 2026-06-22
- **Deciders:** founder, tech lead
- **Scope:** the `packages/mail` implementation choices (template engine, transport, layout pattern). Companion to the system-level ADRs 0013 and 0014.

## Context

`packages/mail` is the empty package at `apps/template/packages/mail/`. The auth package's 4 `send*` hooks (`packages/auth/src/auth.ts:55/63/73/85`) currently `console.log` — they need a real target. The 6 templates (reset password, verify email, magic link, OTP × 3) need to be written.

Three local-scope choices had to be locked in before the M1 implementation:

1. **Template engine** — react-email v6 unified, `@react-email/components` legacy, jsx-email, or MJML? (The cross-cutting ADR is [`../../../10-decisions/0013-react-email-v6-unified-package.md`](../../../10-decisions/0013-react-email-v6-unified-package.md).)
2. **Transport** — Resend, Postmark, SendGrid, AWS SES, Nodemailer + SMTP? (The cross-cutting ADR is [`../../../10-decisions/0014-resend-as-transport.md`](../../../10-decisions/0014-resend-as-transport.md).)
3. **Layout pattern** — bare templates (each owns its own `<Html><Head><Tailwind>...`), shared `<Wrapper>` component (supastarter's pattern), or a render prop / HOC?

This ADR documents the **local** decision (the layout pattern) and locks in the implementation choices the system ADRs already made. It does NOT re-litigate those system decisions.

## Considered options

### Option A — Bare templates (each owns its own `<Html><Head><Tailwind>`)

Pros: zero abstraction, copy-paste from React Email docs works directly.
Cons: brand chrome (logo, colors, fonts) duplicated 6 times. One rebrand = 6 file edits. Easy to drift.

### Option B — Shared `<Wrapper>` component (supastarter's pattern)

Pros: brand chrome in 1 file. Adding a footer to all templates = 1 edit. Logo swap = 1 edit.
Cons: one more abstraction to learn. New template authors must remember to use it.

### Option C — HOC or render prop

Pros: very flexible.
Cons: more indirection than necessary for 6 templates.

### Option D — Render to HTML at build time, store as static

Pros: no runtime React cost.
Cons: can't customize per recipient without re-rendering. Defeats the point of React Email.

## Decision

**Option B — shared `<Wrapper>` component**, following the supastarter pattern (see agent memory [`../../../../.claude/agent-memory/tech-lead/reference-supastarter-mailing-pattern.md`](../../../../.claude/agent-memory/tech-lead/reference-supastarter-mailing-pattern.md) for the full rationale).

The `<Wrapper>` lives in `packages/mail/src/templates/Wrapper.tsx` and owns:

- `<Html lang="en" dir="ltr">`
- `<Head><Font fontFamily="Inter" .../><Tailwind config={{ presets: [pixelBasedPreset], theme: { extend: { colors: { brand: '#007291' } } } }}>`
- `<Section className="bg-background p-4"><Container className="rounded-lg bg-card p-6">{Logo}{children}</Container></Section>`

Every template body is wrapped in `<Wrapper preview="...">{...}</Wrapper>`. The `preview` prop sets the inbox preview text (the snippet shown in Gmail / Outlook before opening).

The transport is **Resend** (per ADR 0014) and the template engine is **react-email v6 unified** (per ADR 0013). Both are imported as `from 'react-email'` (single package, post-v6).

## Consequences

**Positive:**
- Brand changes are a 1-file edit (`Wrapper.tsx`).
- The 6 templates stay tiny — each one is `<Wrapper><Heading/><Text/><Button/></Wrapper>` plus typed props.
- The supastarter pattern is well-trodden — the agent memory has the full reference, we are not inventing.
- The `<Tailwind>` component gives us Tailwind DX in emails (with `pixelBasedPreset` for Outlook `rem` compat).
- `react-email` v6 import path means no `@react-email/components` legacy noise.

**Negative:**
- One more abstraction (`<Wrapper>`). Template authors have to remember to use it. Mitigation: the ESLint rule + a code-review checklist.
- The Wrapper couples all 6 templates to the same brand chrome. If we ever want a "minimal" variant for OTP (no logo, no header), we need a second Wrapper. Acceptable — 2 Wrappers for 2 visual contexts is fine.

**Neutral:**
- The Wrapper adds 1-2 KB to every rendered HTML. Negligible.
- The `<Tailwind>` component requires Tailwind 4.1.12 internally. No version conflict with `apps/web`'s PostCSS pipeline.

## Why we might revisit

- If we adopt a fundamentally different brand per tenant (white-label), the single-Wrapper pattern breaks. We'd need a per-tenant Wrapper registry. DeesseJS is not multi-tenant at the brand level (the buyer owns their own deployment), so this is not a near-term concern.
- If react-email ships a built-in layout primitive in a future version, we can replace the hand-rolled Wrapper. Watch the changelog.

## References

- System ADRs:
  - [ADR 0013 — react-email v6 unified package](../../../10-decisions/0013-react-email-v6-unified-package.md)
  - [ADR 0014 — Resend as transport](../../../10-decisions/0014-resend-as-transport.md)
- Stack rationale: [`../../../01-stack/resend-react-email.md`](../../../01-stack/resend-react-email.md)
- Package docs: [`../README.md`](../README.md), [`../structure.md`](../structure.md), [`../conventions.md`](../conventions.md)
- Agent memory:
  - [Mail stack decision](../../../../.claude/agent-memory/tech-lead/project-mail-stack-decision.md)
  - [packages/mail architecture proposal](../../../../.claude/agent-memory/tech-lead/project-packages-mail-architecture.md)
  - [supastarter mailing pattern](../../../../.claude/agent-memory/tech-lead/reference-supastarter-mailing-pattern.md)
  - [React Email v6 unified reference](../../../../.claude/agent-memory/tech-lead/reference-react-email-v6-unified.md)
  - [Resend SDK reference](../../../../.claude/agent-memory/tech-lead/reference-resend-sdk-details.md)
