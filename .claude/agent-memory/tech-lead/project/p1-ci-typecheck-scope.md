---
name: p1-ci-typecheck-scope
description: RESOLVED 2026-07-28 (mostly) — the typecheck job runs `pnpm turbo typecheck --force` (no workspace filter) and uses --frozen-lockfile like the other jobs. Only a `--filter=web --force` pre-build remains, likely to generate content-collections types. P1 closed.
metadata:
  type: project
---

# RESOLVED 2026-07-28 (mostly)

Verified by audit on 2026-07-28 (`.github/workflows/ci.yml`):

- The typecheck job installs with `pnpm install --frozen-lockfile` (like the other jobs — the original P1 claim "skips --frozen-lockfile" was wrong).
- The typecheck step itself runs `pnpm turbo typecheck --force` with **no `--filter`** — every workspace with a `typecheck` script is covered.
- The only `--filter=web --force` call in the file is a **pre-build step** (`pnpm turbo build --filter=web --force`) that runs before typecheck. The likely reason: `apps/web` uses `content-collections` for its MDX blog/changelog, and the generated types must exist before `tsc --noEmit`. Not a coverage defect.

The original concern (lockfile drift silently absorbed, three-of-twelve workspaces guarded) is **not** reproduced.

## Open question (not a P1)

If the content-collections pre-build is no longer needed on a future version, the `--filter=web` step could be dropped. Not blocking.

Related: [[stack]], [[feedback-verify-high-severity-findings]].
