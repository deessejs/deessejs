# 0010. v0.0.1 = `create-next-app` baseline

- **Status:** Accepted
- **Date:** 2026-06-17
- **Deciders:** founder, tech lead

## Context and problem statement

We need a starting point for the codebase — the first commit, the first release, the "before" state. The question is what that starting point should be:

- How much DeesseJS opinion should be baked in at v0.0.1?
- Is the modular contract enforced from the first commit, or introduced later?
- How does the "ratchet" model (each version pushes forward, never resets) apply to the very first version?

We also have a positioning concern: the buyer-voice research identified that ShipFast's repo does not push to GitHub out of the box, which is a trust failure. Our v0.0.1 should be the opposite — it pushes, runs, and is exactly what `create-next-app` produces.

## Considered options

1. **`create-next-app` baseline, nothing else.** v0.0.1 is the literal output of `npx create-next-app@latest` with default options. No Drizzle, no Better Auth, no shadcn, no `src/features/`, no env-var system, no delete tests. Just the Next.js scaffold.

2. **`create-next-app` + our opinions immediately.** v0.0.1 ships with the modular folder structure, the env-var system, the delete-test infrastructure, and one or two example feature modules. "The platform is ready" at v0.0.1.

3. **Custom scaffold from scratch.** v0.0.1 is a hand-written scaffold that includes everything we want. No use of `create-next-app`.

## Decision

**Option 1.** v0.0.1 = `create-next-app` baseline, nothing else. Each subsequent version (v0.0.2, v0.0.3, ..., v0.0.9) introduces one piece of the platform. The first version that has a DeesseJS opinion is v0.0.2 (Drizzle wired).

## Consequences

**Positive:**

- The "before" state is visible. A new contributor can `git checkout v0.0.1` and see exactly what we started from.
- The release process is exercised on the smallest possible artifact. If the tag, the changelog, or the version bump breaks, it breaks on empty.
- The repo pushes to GitHub on first try (ShipFast's failure mode is solved by construction).
- The ratchet model is enforced from the first version: nothing is retroactively removed, only added.
- The delete-test contract is testable from v0.0.6 onwards (when the modular structure lands): "can I remove the Drizzle module and get back to v0.0.1?" is a one-line git diff.

**Negative:**

- v0.0.1 has no DeesseJS identity. It is just a Next.js scaffold. Buyers who land on the repo at v0.0.1 see no differentiator.
- Several patch versions (v0.0.2 → v0.0.9) ship with no user-facing value. They feel like "no progress" to anyone watching the repo.
- The modular contract is **not enforced** at v0.0.1. A contributor who joins at v0.0.1 might add features outside the contract before v0.0.6 introduces it.

**Neutral:**

- v0.0.1 is not buyer-facing. It will not be marketed.
- The ADR count is now 10 (9 tech decisions + this process decision). The seed set in `architecture/10-decisions/README.md` will need an entry for 0010.

**Why we might revisit:**

- If the bootstrap takes too long (we are still at v0.0.5 in week 3), we may bundle v0.0.5/v0.0.6 into a single v0.0.5 to ship the modular structure earlier.
- If buyers see the repo at v0.0.1 (because v0.0.x is public), and the lack of opinion confuses them, we may decide to make v0.0.1 → v0.1.0 (skipping intermediate versions) on the public repo while keeping them in git history.

## References

- [`../../process/release-process.md`](../../process/release-process.md) — the release process and the v0.0.1 entry in the version progression.
- [`../../process/role-definitions.md`](../../process/role-definitions.md) — who owns the v0.0.1 release.
- [`../README.md`](../README.md) — the ADR index and conventions.
- [`../../product/build-roadmap.md`](../../product/build-roadmap.md) — the milestone definitions.
