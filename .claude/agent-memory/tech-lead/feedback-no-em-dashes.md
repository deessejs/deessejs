---
name: feedback-no-em-dashes
description: User dislikes em-dashes (—) in README / prose; use parentheses or periods instead. Validated 2026-07-28 after I introduced 16 of them in the README redesign (commit c336cff).
metadata:
  type: feedback
---

In README files and other documentation written for this user, **do not use em-dashes (—)**. Substitute with:

- **Parentheses** for inline asides / clarifications (e.g. `Next.js 16 (marketing site)` instead of `Next.js 16 — marketing site`)
- **Period + capitalize** for sentence breaks (e.g. `TypeScript 6. Chosen because…` instead of `TypeScript 6 — chosen because…`)

**Why:** user explicitly requested this on 2026-07-28 right after the README redesign landed (`but remove em-dashes from readme`). I had introduced 16 em-dashes across table cells, code-block comments, and narrative sentences. Replaced in commit `c336cff` on `chore/setup-staging-workflow`.

**How to apply:** when drafting README content, prose, or long-form docs, never reach for the em-dash. Read it back before sending — if you see ` — `, swap it for ` (…)` or `. …`. The em-dash is also stylistically heavy compared to the user's casual register (see [[user]] — French, casual, autonomous decisions).

Related: [[feedback-readme-layout-2026]] (README structure where this rule applies), [[user]] (register).