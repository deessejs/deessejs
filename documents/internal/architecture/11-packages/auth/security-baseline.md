# Security baseline — version policy and bump procedure

Better Auth is a security-critical dependency. It owns the session layer, the org layer, and the API key layer. A vulnerability in Better Auth is a vulnerability in our product. This doc defines the version policy and the procedure for staying current.

## Current baseline (2026-06-18)

| | |
|---|---|
| **Pinned version** | `1.6.19` (exact, no `^` / `~`) |
| **Hard minimum** | `1.6.14` (security baseline from June 2026 advisory cycle) |
| **Critical minimum** | `1.6.11` (org invitation vulnerability fix) |
| **Distribution** | exact pin in `packages/auth/package.json` + `pnpm-lock.yaml` |
| **Advisory source** | [GitHub Security Advisories — better-auth](https://github.com/better-auth/better-auth/security/advisories) |
| **Advisory blog** | https://better-auth.com/blog |

See [`decisions/0001-security-baseline-1.6.19.md`](./decisions/0001-security-baseline-1.6.19.md) for the full rationale.

## The June 2026 security update — what we dodged by pinning 1.6.19

| Advisory | Severity | Component | Fixed in | Our exposure |
|---|---|---|---|---|
| GHSA-fmh4-wcc4-5jm3 | High | Organization invitation ownership | 1.6.11 | **Direct** (we ship org plugin) |
| GHSA-g38m-r43w-p2q7 | High | OAuth account linking ownership | 1.6.11 | **Direct** (we ship Google + GitHub) |
| GHSA-2vg6-77g8-24mp | Low | Session cleanup after user deletion | 1.6.11 | Direct (we ship account deletion) |
| GHSA-cq3f-vc6p-68fh | High | Device-flow owner binding (CVE-2026-45337) | 1.6.11 | None (we don't ship device auth) |
| GHSA-pw9m-5jxm-xr6h | Critical | OIDC + MCP refresh-token handling | 1.6.11 | None (deprecated plugins) |
| GHSA-86j7-9j95-vpqj | High | OIDC + MCP redirect URI validation | 1.6.13 | None (deprecated plugins) |
| GHSA-9h47-pqcx-hjr4 | High | OIDC + MCP protocol defaults | 1.6.11 | None (deprecated plugins) |
| GHSA-5rr4-8452-hf4v | Critical | SSO provider URL validation | 1.6.11 | None (we don't ship SSO) |
| GHSA-gv74-j8m3-fg5f | High | SSO provider authorization | 1.6.11 | None (we don't ship SSO) |

**Conclusion** : by pinning 1.6.19, we are 8 patches ahead of the security baseline (1.6.11) and 5 patches ahead of the advisory blog's recommended version (1.6.14). All known advisories are addressed.

## Advisory monitoring

**Automated**:

- **GitHub Dependabot** on the `deessejs-template` repo, watching `better-auth` and all `@better-auth/*` scoped packages. Dependabot opens a PR within 24h of a new advisory.
- **`npm audit`** runs in CI on every PR. A new HIGH or CRITICAL advisory fails the build.

**Manual** (weekly):

- Watch the [better-auth/better-auth releases page](https://github.com/better-auth/better-auth/releases) — new releases ship with the fix list.
- Read the monthly security update blog at `https://better-auth.com/blog` (the team publishes one per cycle).

**Critical alerts** (within 24h of release):

- Subscribe to the GitHub repo's "Watch → Custom → Security alerts" notifications.
- Maintainer-level responsibility: review the changelog for any `**BREAKING**` markers in security fixes.

## Bump procedure (the boring but important part)

### Routine bump (no breaking changes, e.g. 1.6.19 → 1.6.20)

1. **`packages/auth/package.json`** : bump `better-auth` to the new version (exact pin).
2. **`packages/auth/package.json`** : bump `@better-auth/drizzle-adapter` and `@better-auth/api-key` to match.
3. **`pnpm install`** : refresh the lockfile.
4. **Re-run the schema generator** : `cd packages/auth && pnpm auth generate --output ../database/src/schema/auth/`. Review the diff. If there are schema changes, run `pnpm --filter @deessejs/database db:generate` to create the migration. Commit both.
5. **Run the full test suite** : `pnpm test` in `packages/auth` and `pnpm --filter @deessejs/api test`.
6. **Manual smoke** : sign in, sign out, OAuth flow, API key create + verify, org switcher, impersonation.
7. **Tag and merge** : PR with the bump. The CI runs all tests; if green, merge.

Estimated time : **30-60 minutes** for a routine bump.

### Security bump (e.g. 1.6.19 → 1.6.20 with a security fix)

Same as routine, but:

- **Expedited** : bypass the normal PR review queue. One maintainer review is enough.
- **Backport if needed** : if the fix is in `next` but not yet stable, pin the `next` channel and document the deviation in this file.
- **Notify buyers** : if the buyer is using a deployed version with the vulnerability, we ship a security advisory in the buyer dashboard and a `SECURITY.md` note on the public repo.

### Major bump (e.g. 1.6.x → 1.7.0 — when v1.7 ships)

Better Auth 1.7 is in beta as of 2026-06-18 (the deprecated `oidcProvider` and `mcp` plugins are scheduled for removal). The bump is more involved:

1. **Read the migration guide** at `https://better-auth.com/docs/migration-guides`.
2. **Open a tracking issue** with the work list.
3. **Bump and re-run the schema generator** in a branch.
4. **Audit all `auth.api.*` calls** in `packages/api`. Deprecations are signaled in the changelog.
5. **Audit the auth client** in `apps/web` (uses `createAuthClient`).
6. **Run the full E2E suite** (sign-in, OAuth, magic link, 2FA, passkey, API key, org switch, impersonation).
7. **Update this doc** to reflect the new baseline.

Estimated time : **1-2 days** for a major bump, depending on the scope of breaking changes.

## What we monitor for in advisories

When a new advisory drops, we check:

1. **Do we use the affected component?** (Org plugin, OAuth, API key, etc.)
2. **Is the advisory in the hard minimum or above?** If yes, **immediate bump**. If it's in the latest stable, **routine bump within 7 days**.
3. **Is there a workaround?** Better Auth sometimes publishes a workaround in the advisory body when a fix can't ship in the stable line.
4. **Is the affected code path reachable from our usage pattern?** Some advisories are about attack patterns we don't expose (e.g. the SCIM / OIDC advisories that don't apply to us).

## Operational checklist

- [ ] GitHub Dependabot enabled on `better-auth` + `@better-auth/*` packages
- [ ] `npm audit` in CI, fails on HIGH/CRITICAL
- [ ] Weekly changelog review by a maintainer
- [ ] Security blog RSS / watch on the repo
- [ ] `SECURITY.md` in the public repo with disclosure policy
- [ ] Buyer's deploy process can be triggered within 24h of a critical advisory
- [ ] Runbook for "rotate all sessions" (in case a session secret leaks)

## Tracked upstream issues that affect our integration

These are not security advisories but bugs / RFEs in Better Auth that we workaround today. Each entry has the workaround and the tracking state.

| Issue | What it fixes | Status | Workaround today | Tracking |
|---|---|---|---|---|
| [#3996](https://github.com/better-auth/better-auth/issues/3996) | `returnHeaders: true` on `auth.api.getSession` to avoid the `asResponse: true` double-parse | Closed as duplicate of [#3780](https://github.com/better-auth/better-auth/issues/3780); not shipped as of 1.6.19 | Use `asResponse: true` + propagate `set-cookie` to Hono response. See [`integrations.md` §2](./integrations.md#2-session-middleware--the-cookiecache-workaround). | Watch the changelog; replace the workaround in a routine bump PR. |
| PR #6454 | `feat(admin): prevent impersonating admins by default` | Merged in 1.6.x | Our admin procedures respect the new default. | Done. |

When a tracked issue ships, the workaround section in `integrations.md` is updated, and a routine bump PR (per the procedure above) picks up the new behavior.

## Cross-references

- [`decisions/0001-security-baseline-1.6.19.md`](./decisions/0001-security-baseline-1.6.19.md) — the ADR that pins 1.6.19
- [`../../06-security/`](../../06-security/) — the system-wide security posture
- [Better Auth — Security advisories](https://github.com/better-auth/better-auth/security/advisories)
- [Better Auth — Blog (security updates)](https://better-auth.com/blog)
- [Better Auth — Changelog](https://better-auth.com/changelog)
