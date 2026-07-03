---
name: project-12-apps-cli-open-questions
description: The 7 decisions Diego must arbitrate for the deesse init MVP; Q2 resolved (no picker); default recommendations in each
metadata:
  type: project
---

Captured 2026-07-02 from the architecture doc. **Q2 was resolved the same day**: the CLI is agent-first → no interactive picker at MVP, ever.

Awaiting Diego's explicit decision on the remaining 6.

## Resolved

~~2. **MVP scope.** Strict `init --template URL` only, or also interactive picker when `--template` is omitted.~~
**RESOLVED 2026-07-02**: agent-first means no interactive picker at MVP. Strict flag-only mode. If `--template` is missing, the CLI errors with a usage hint, not a prompt. This was a direct consequence of the agent-first thesis.

## Still pending

1. **npm package name + bin**
   - `@deessejs/cli` (scoped, bin `deesse`)
   - `create-deessejs` (unscoped, conventional, bin `create-deessejs`)
   - **Default rec**: `create-deessejs` + alias `deesse`. Matches Vercel's `create-next-app` vs `next` precedent.

3. **Token replacement surface**
   - Built-in regex table (projectName, port, orgSlug, date)
   - Template-side `transform.ts` hook from day 1
   - **Default rec**: built-in only for MVP. Hook is v0.2 (M9 of the roadmap).

4. **Private templates + GIGET_AUTH**
   - Expose at MVP for the `cloud` template
   - Defer to v0.2
   - **Default rec**: defer. No private templates at MVP.

5. **Migration of `apps/template` → `deessejs/template-starter`**
   - During MVP (blocks the release)
   - After MVP ships
   - **Default rec**: after MVP. M4 of the roadmap is a separate milestone precisely to catch "the fork doesn't work cleanly" early without blocking the CLI skeleton.

6. **Templates registry file**
   - Ship `templates/*.json` in the CLI repo (catalog of {name → URL})
   - Hard-code the supported templates in the source
   - **Default rec**: registry file. Mirrors giget's own registry format, enables `--template <bare-name>` without code changes.

7. **NEW — Agent-detection contract (added 2026-07-02)**
   - When the CLI detects an AI agent via `@vercel/detect-agent`, what should it do beyond printing the non-interactive form upfront?
   - Auto-set sane defaults from env vars (`DEESSE_TEMPLATE`, `DEESSE_PORT`, etc.)?
   - Or always require explicit flags?
   - **Default rec**: auto-set from env, override with explicit flags. Lets coding-agent platforms set env once and inherit defaults. The env var naming convention is documented in `--help`.

## Where these are tracked

- `documents/internal/architecture/12-apps/cli/README.md` — "Open questions" section at the end
- `documents/internal/architecture/12-apps/cli/roadmap.md` — "Open risks" section at the end (related but distinct)
- `documents/internal/architecture/12-apps/cli/architecture.md#agent-first-contract` — Q7 in detail

## Why this is a memory

Diego confirmed 2026-06-29 he wants proactive decision-batching. The 6 remaining questions are batched here so he can answer all at once instead of being asked 6 times. The default recommendations are his to take or reject.
