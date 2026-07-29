# `01-stack/` — Per-technology rationale

## Purpose

One Markdown file per major technology in the stack, documenting **why we picked it**, what alternatives we considered, and the tradeoffs we accepted.

The product doc lists the stack. This folder is the **evidence and reasoning** behind each choice — so we don't re-litigate decisions every quarter, and so a new contributor can understand the constraints before suggesting swaps.

## What's in here

- `README.md` (this file) — the stack matrix: tech, decision date, owner, status, link to its detail file.
- One `<tech>.md` per locked technology. The current set:
  - `nextjs.md` — the web framework.
  - `tailwind-shadcn.md` — UI styling + component primitives.
  - `drizzle.md` — the ORM.
  - `better-auth.md` — auth, orgs, sessions.
  - `orpc-hono-sdk.md` — the oRPC + Hono REST + OpenAPI + SDK + CLI pipeline (single source of truth); the most novel piece in the stack, treated as one file.
  - `vercel-ai-sdk.md` — LLM provider abstraction.
  - `upstash-redis-realtime.md` — cache, sessions, rate limit, metering, realtime.
  - `trigger-dev.md` — code-first background jobs and workflows.
  - `qstash.md` — simple cron and delayed delivery.
  - `cloudflare-r2.md` — object storage.
  - `stripe.md` — billing and metered usage.
  - `resend-react-email.md` — transactional email.
  - `fumadocs.md` — docs and blog.
  - `commander.md` — CLI argument parsing.
  - `bun.md` — runtime for the CLI sub-app only.
  - `tanstack-query.md` — client-side data fetching and cache.
  - `tanstack-tables.md` — tables with sort/filter/paginate.
  - `tanstack-form.md` — forms with Zod validation.
  - `zod.md` — validation and schema library.
  - `zustand.md` — client-side cross-component state.
  - `i18n.md` — English-only for v1; `next-intl` candidate for v2; architecture reserved.
  - `testing.md` — Vitest, Playwright, axe-core, Lighthouse CI, MSW, k6, Husky, lint-staged.

Add a new file here whenever we lock a new tech. Do **not** bundle multiple techs into one file.

## Conventions

- Each `<tech>.md` follows the same template:
  1. **Decision** — what we chose, when, by whom.
  2. **Why** — the problem and the constraints.
  3. **Alternatives considered** — at least two, with the reason we rejected each.
  4. **Tradeoffs accepted** — what we give up; what would make us revisit.
  5. **Cross-references** — to the product doc, related ADRs in `10-decisions/`, and the relevant feature specs.
- Decision date and owner are required. "By the team" is not an owner.
- If a decision is revisited, **edit the existing file** (don't append a "v2" section). The history is in `10-decisions/`.

## Related

- [`../product/architecture.md`](../../product/architecture.md) — the high-level stack table.
- [`../product/open-questions.md`](../../product/open-questions.md) — decisions still pending.
- [`10-decisions/`](../10-decisions/) — ADRs (the historical record).
- [`00-system-overview/`](../00-system-overview/) — the system-level views that bind these techs together.
