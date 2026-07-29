# 0001. Better Auth security baseline: pin 1.6.19 (exact)

- **Status:** Accepted
- **Date:** 2026-06-18
- **Deciders:** founder, tech lead
- **Scope:** `packages/auth`, `better-auth` dependency

## Context and problem statement

Better Auth is a security-critical dependency. It owns the session layer, the org + RBAC layer, and the API key layer for the entire DeesseJS system. A vulnerability in Better Auth is a vulnerability in our product. We need an explicit version policy and a bump procedure.

The June 2026 security update from Better Auth published a batch of advisories spanning core, the org plugin, the OAuth provider, the SCIM provider, and the SSO provider. Most have stable fixes; a few require the `next` channel or a workaround.

## Considered options

### Option 1 — Pin to latest stable `^1.6.x` (caret range)

- Pros: gets patches automatically.
- Cons: a `^1.6.x` range will pick up `1.6.99` if released. Floating minor is a security risk for a security-critical dep. **Rejected.**

### Option 2 — Pin to `>=1.6.14 <2.0.0` (range with floor)

- Pros: forces the security baseline, but allows patches within the 1.6 line.
- Cons: still allows floats within 1.6.x. A bug in 1.6.50 that we never reviewed could ship. **Rejected.**

### Option 3 — Pin exact `1.6.19` (chosen)

- Pros: full control. Bump is a deliberate PR. Matches the Drizzle v1 RC pin strategy.
- Cons: bumps are manual. We miss automatic patch delivery. **Tradeoff accepted** — the bump procedure is fast (30-60 min for routine) and the security monitoring is automated (Dependabot, npm audit).

## Decision

**Pin `better-auth` (and all `@better-auth/*` scoped packages) to exact `1.6.19`. No `^`, no `~`, no `>=`. Lock the lockfile.**

When the next patch ships, open a PR titled `chore(deps): bump better-auth to X.Y.Z`. The PR is reviewed like any other dep bump (no expedited process unless it's a security fix, see [`../security-baseline.md`](../security-baseline.md)).

## Why

### 1.6.19 closes the June 2026 advisory set

The advisories that matter for us (org invitation, OAuth account linking, session cleanup) are all patched in 1.6.19. We are 8 patches ahead of the security baseline and 5 patches ahead of the advisory blog's recommended version.

### Floating versions are a security antipattern

For a dep that owns auth, a `^1.6.x` range means a `1.6.50` bug (or worse, a regression in a security fix) could land without our review. Better Auth ships fast — `1.6.19` was 3 days old at the time of this ADR. A caret range would have already pulled in 2-3 patches we haven't read.

### The bump procedure is bounded

30-60 minutes for a routine bump (no schema changes), 1-2 days for a major bump. The procedure is documented in [`../security-baseline.md`](../security-baseline.md) and rehearsed. The cost of the manual PR is much smaller than the cost of a missed security review.

### Dependabot + npm audit catch the rest

- **Dependabot** opens a PR within 24h of a new advisory. We review and merge (or backport if needed).
- **`npm audit`** in CI fails the build on a new HIGH or CRITICAL advisory.
- **Weekly changelog review** by a maintainer catches non-security improvements.

These three signals together mean we won't miss a critical advisory even with an exact pin.

## Tradeoffs accepted

- **Manual bumps are slower than floats.** A `^1.6.x` would have given us auto-patches. We accept the cost because the security review is the load-bearing property.
- **We may miss a patch note.** A non-advisory fix (e.g. a perf improvement) might not trigger Dependabot. The weekly changelog review catches these.
- **Bumps can break.** A patch in 1.6.x can include a small breaking change (Better Auth has done this in the past for security reasons). We treat every bump as a "may require a code change" PR.

## Why we might revisit

- **If Better Auth moves to a faster release cadence** that makes manual pinning operationally expensive. Today, ~3-4 minor releases per month.
- **If a future Better Auth version introduces a stable LTS channel** (Better Auth does not have one today). An LTS would justify a caret range.
- **If we ship a hosted variant** (post-v1) where the dep is shared with many buyers and a manual bump is no longer tractable.

## Operational checklist

The bump procedure has four signals, three of which are automated:

- [x] **Dependabot** watches `better-auth` and `@better-auth/*` packages. Opens a PR within 24h of an advisory.
- [x] **`npm audit`** in CI. Fails the build on HIGH / CRITICAL.
- [x] **Weekly changelog review** by a maintainer. Manual signal.
- [x] **Security blog watch** at `https://better-auth.com/blog`. RSS or GitHub watch.

When a new advisory hits, the response is in [`../security-baseline.md`](../security-baseline.md) (the "Bump procedure" section).

## Consequences

**Positive:**
- We control which Better Auth version is in production at all times.
- A regression in a security fix cannot silently land.
- The bump PR is a reviewable artifact (commit diff, CI results, manual smoke checklist).

**Negative:**
- Bumps are manual work. 30-60 min per routine, 1-2 days per major.
- We may ship a version that is one patch behind the latest if the routine review slips. Mitigated by the automated signals.

**Neutral:**
- The bump PR is part of the normal PR queue. No special process unless it's a security fix.

## Implementation

- `packages/auth/package.json` pins `better-auth@1.6.19` (exact, no range).
- The same applies to `@better-auth/drizzle-adapter` and `@better-auth/api-key`.
- `pnpm-lock.yaml` is committed and the exact versions are visible.
- The [`../security-baseline.md`](../security-baseline.md) doc is the runbook for the next bump.

## References

- [`../security-baseline.md`](../security-baseline.md) — operational runbook, advisory monitoring, bump procedure
- [`../setup.md`](../setup.md) — the `createAuth()` configuration that depends on this version
- [`../plugins.md`](../plugins.md) — the plugin stack that's exposed via the auth instance
- [Better Auth — Security update June 2026](https://better-auth.com/blog/security-update-june-2026) — the advisory set we dodged
- [Better Auth — Changelog](https://better-auth.com/changelog) — release-by-release
- [Better Auth — Security advisories](https://github.com/better-auth/better-auth/security/advisories) — the source of truth
- [`../../06-security/`](../../06-security/) — system-wide security posture
