# 0013. Adopt react-email v6 unified package (single import, no `@react-email/components`)

- **Status:** Accepted
- **Date:** 2026-06-22
- **Deciders:** founder, tech lead
- **Scope:** tooling choice for `packages/mail` template engine

## Context and problem statement

React Email shipped **v6.0.0 on 2026-04-16**, moving all components and rendering utilities into a single `react-email` package. The legacy `@react-email/components`, `@react-email/button`, `@react-email/render`, etc. packages are deprecated (still installable, still functional, but receive no further updates). Only `@react-email/render` and `@react-email/ui` survive as separate packages.

The pre-v6 architecture (`@react-email/components` + `@react-email/render` + `react-email` CLI) created confusion:
- Three packages for what felt like one library
- "Where do I import `render()` from?" — same answer as "Where do I import `<Button>` from?"
- Maintenance burden for the React Email team
- Tutorial/docs examples split between the old and new patterns

For DeesseJS, the question is: **what import path do we use for the 6 mail templates we're about to ship in `packages/mail/templates/`**? This is a tooling choice that affects every template file forever (template authors will copy-paste from our examples).

## Considered options

1. **Adopt v6 unified package** — `import { Button, Html, render } from 'react-email'`. Single source.
2. **Stay on `@react-email/components` + `@react-email/render`** — pre-v6 pattern, deprecated but still works.
3. **Stay on v5 (no v6 jump)** — ignore v6 entirely until v7 forces our hand.
4. **Adopt `jsx-email` (shellscape, 1.2k stars)** — concurrent sérieux with email-client CLI checker.

## Decision

**Option 1: adopt react-email v6 unified package as the template engine for `packages/mail`.** All imports come from `react-email`.

We explicitly reject:
- **Option 2**: deprecated, would leave us on a maintenance dead-end 6 months from now.
- **Option 3**: choosing to lag a major version with no upside — we'd be the only React Email user on v5.
- **Option 4**: `jsx-email` is React 18 only, smaller team, no clear advantage for our use case.

## Consequences

**Positive:**
- Single import path — template authors don't have to remember which package owns which component.
- Future React Email releases (v6.x, v7) all land in the same package — no migration work.
- 19k stars on the `resend/react-email` repo, 2M weekly downloads on the unified package — strong ecosystem signal.
- React 19.2 + Next.js 16 officially supported since v5.0 — matches `apps/web` versions exactly.
- Smaller `package.json` — one `react-email` dep instead of 20+ scoped component packages.

**Negative:**
- Anyone copy-pasting from pre-v6 tutorials (most online) gets the old import path — they'll need to mentally translate. The rewrite of `01-stack/resend-react-email.md` (2026-06-22) makes this clear.
- The `react-email` package itself has more dependencies baked in (it used to be 20 scoped micro-packages). Lighter per-import but heavier install.

**Neutral:**
- The CLI command (`email dev`) is unchanged.
- `<Tailwind>` component still requires Tailwind 4.1.12 internally — independent of any other Tailwind pipeline.

## Why we might revisit

If Resend / React Email splits back into scoped packages (highly unlikely), or if we adopt a different template engine entirely (e.g. MJML), we'd reopen this. Neither signal exists today.

## References

- [ADR 0014 — Resend as transport](./0014-resend-as-transport.md) — the companion transport decision
- [React Email v6 release notes](https://github.com/resend/react-email/releases/tag/react-email@6.0.0)
- [React Email docs index](https://react.email/docs/llms.txt)
- [`../01-stack/resend-react-email.md`](../01-stack/resend-react-email.md) — updated 2026-06-22 to reflect this decision
- [`../11-packages/mail/`](../11-packages/mail/) — the implementation
- [Agent memory: react-email v6 unified reference](../../.claude/agent-memory/tech-lead/reference-react-email-v6-unified.md)
