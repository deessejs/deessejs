# saas-template divergence plan

_Date: 2026-07-30. Status: draft, pending review._

## Context

The user repo (`deessejs/deessejs`) forked from `github.com/deessejs/saas-template` (the SaaS template, "the SaaS template that never sleeps," MIT, public). Both share the same initial commit `102d837`. The user has layered intentional divergence on top: an apps/cli workspace, plan documents in docs/engineering/plans/, AGENTS.md customizations (staging-first git workflow, internal @deessejs/* packages section), and an architectural refactor of the templates endpoint out of apps/web into packages/api.

Managing the fork relationship requires an explicit posture: what stays locked-local, what gets pushed back as upstream PRs, and what mirrors from upstream releases.

This plan is strategy, not implementation. It also doesn't touch the apps/cli integration with @deessejs/errors and @deessejs/fp (separate plan: [cli-errors-fp-integration.md](./cli-errors-fp-integration.md)), nor the cli test suite (separate plan: [cli-v1-testing.md](./cli-v1-testing.md)).

## What sits on top of upstream

A snapshot taken from `git diff --stat 102d837..HEAD` plus the working-tree deltas at plan write time.

| Category | Item | Lock status |
|---|---|---|
| App | `apps/cli/` full workspace (commands, utils, vitest config, fixtures) | Locked-local |
| App | `apps/web/src/app/api/` (route handlers created during templates-endpoint work) | Locked-local until Phase 1 classification |
| Package | `packages/api/src/templates.ts` + tweak in `packages/api/src/index.ts` | Upstream-trackable (see `2a37346` refactor) |
| Docs | `docs/engineering/plans/cli-v1-testing.md` (257 lines) | Locked-local |
| Docs | `docs/engineering/plans/cli-errors-fp-integration.md` (150 lines) | Locked-local |
| Docs | `AGENTS.md` staging-first workflow block | Locked-local |
| Docs | `AGENTS.md` `### Internal packages (@deessejs/*)` section | Locked-local |
| Tooling | `apps/cli/vitest.config.ts` (pool: "forks," 30s timeouts) | Upstream-trackable (see Phase 3) |
| Tests | `apps/cli/test/**` (run-cli, git-fixture, fake-api helpers + unit/integration tests) | Upstream-trackable (cli-specific, but helpers generalize) |
| Lockfile | `pnpm-lock.yaml` refresh + `pnpm-workspace.yaml` catalog additions (`@deessejs/errors@^1.1.1`, `@deessejs/fp@^1.0.0`) | Catalog additions upstream-trackable; the rest is local-resolved |
| Memory | `.claude/agent-memory/tech-lead/**` (feedback + project memories) | Not in git |

Status legend:
- Locked-local: consumer-specific, stays in the fork, not pushed back.
- Upstream-trackable: candidate for an upstream PR. Decided in Phase 1.

## Goals

- Maintain a per-file divergence catalog (`docs/internal/template-divergence.md`) so every intentional change has a reason and a destination.
- Classify every divergence as locked-local, upstream-trackable, or remove-by-resync.
- Set up passive upstream monitoring (GitHub Watch on Releases) plus an on-demand review cadence when the user signals one.
- Open at least one upstream PR (the templates-endpoint refactor) to exercise the push-back workflow.
- Establish the rule that locked-local divergence is never removed out from under the team without an explicit decision.

## Non-goals

- Becoming an active maintainer of `deessejs/saas-template`.
- Automirroring every upstream change. Mirroring is opt-in per release, gated by user signal.
- Submitting upstream PRs for fork-specific features (CLI workspace, internal-package policy).
- Forcing the user to update the fork in a fixed cadence. Reviews happen on demand (per AGENTS.md "version checks on user signal only").

## Phases

### Phase 0: Catalog the divergence

Goal: every intentional change has an entry in a living doc.

Steps:
- Run `git diff --stat 102d837..HEAD` plus worktree changes.
- Produce `docs/internal/template-divergence.md` with rows: file or directory, upstream SHA on `main`, the fork's SHA, classification, reason.
- Each row gets a one-line reason. Locked-local rows cite the consumer need that justifies them.

Exit criteria:
- File exists.
- Every change on top of `102d837` shows up in the catalog with a reason.
- Classifications sum to 100% of changes (no "unknown" rows).

### Phase 1: Classify with the user

Goal: confirm classifications, especially for ambiguous rows (apps/web route handlers, vitest config patterns).

Steps:
- Walk the catalog with the user.
- For each row: locked-local, upstream-trackable, or remove-by-resync (default: adopt upstream's version).

Exit criteria:
- Every row has an explicit decision signed off by the user.
- Upstream-trackable rows include whether a PR lands now or sits on the back-burner.

### Phase 2: Set up passive monitoring

Goal: detect upstream changes without polling.

Steps:
- Watch `github.com/deessejs/saas-template` in Releases-only mode.
- No CI job that diffs upstream `main` against the fork's `main` on every push.
- No dependabot on the fork's `next` / `drizzle` / etc. unless explicitly enabled.

Exit criteria:
- The GitHub Watch fires.
- A short note lands in AGENTS.md under a new `### Upstream template` subsection, mirrored from the `### Internal packages` policy ("version checks on user signal only").

### Phase 3: Issue-first policy and optional push-back

Goal: every template-owned bug gets an upstream issue alongside the local fix. PRs are optional and decided per case. Mirrors the [Internal packages rule in AGENTS.md](../../AGENTS.md) for a different upstream.

Trigger: a local fix touches code that matches upstream `main` byte-for-byte, OR a fresh clone of upstream `main` reproduces the bug.

Steps per template-owned fix:
1. Local fix lands in the fork first (the team needs it now).
2. Open an upstream issue on `github.com/deessejs/saas-template/issues` (or comment on an existing one). Match `.github/ISSUE_TEMPLATE/` structure (see [feedback-issue-templates memory](../../.claude/agent-memory/tech-lead/feedback-issue-templates.md)).
3. Decide upstream PR or not:
   - Open PR if the change has universal value for any consumer of the template (not just the fork's apps/cli), bug-for-bug-compatible with the template's conventions, and maintainable for the fork across releases.
   - Otherwise, file the issue and stop. The upstream maintainer picks up when ready.
4. Track state in the divergence catalog. Row gains `upstream issue N` or `upstream PR N`, plus status.

Out of scope of this phase:
- Local fixes in `apps/cli/`, AGENTS.md changes, docs/engineering/plans/ content (no upstream action needed).
- Configuration, env, runtime mismatch on the fork's side (local-only).
- Cosmetic, naming, or comment-level issues (below severity threshold).

Initial candidate from the snapshot:
- `packages/api/src/templates.ts` plus `packages/api/src/index.ts` (the move from apps/web). Strong candidate, single file, generic architecture. Issue goes live even if the PR stays on the back-burner for review.

Exit criteria:
- Every template-owned local fix since this policy landed has an open upstream issue (or links to one).
- At least one upstream PR opened (the strongest candidates).
- Each open PR has a divergence-catalog row with a status.

### Phase 4: Pull cycle (on user signal)

Goal: absorb upstream changes without disrupting fork-specific work.

Steps per upstream release that the user signals:
- Review the diff between upstream HEAD and the fork's fork-point-or-last-merge tag.
- For each upstream commit: locked-local row says "skip"; upstream-trackable row says "refresh"; and remove-by-resync row says "drop the fork's override."
- Resolve conflicts in downstream-locked files first (apps/cli, AGENTS.md sections, docs/engineering/plans/) so fork-specific changes survive cleanly.
- Smoke-check apps/web, apps/app, apps/docs, apps/cli against the merged state (lint, typecheck, vitest).

Exit criteria:
- Conflict resolution didn't destroy any locked-local change.
- All commands green locally.
- Divergence catalog updated to reflect the new fork SHA and any new locked-vs-trackable decisions.

## Decision principle

When unsure whether to push something back upstream, default to **locked-local**. Local divergence only justifies a PR when:
- The change has universal value for any consumer of the template (not just the fork's apps/cli).
- The change is bug-for-bug-compatible with the fork's local conventions or has minimal fork-specific logic.
- The team can support it across the upstream release window without a dedicated maintainer.

Otherwise, keep it local and document the reason in the divergence catalog.

## Open questions

1. **apps/web route handlers (`apps/web/src/app/api/`)**: created during the templates-endpoint move, currently empty or in flux. Locked-local, transient, or remove-by-resync. <!-- vale fix: Microsoft.QuestionMarks -->
2. **CLI workspace as upstream PR**: the apps/cli itself is fork-specific (consumer of the registry). But the *patterns* (vitest config, fork spawn, fake-api helper) generalize. Ship as a doc-only PR, or wait until a separate template genuinely needs CLI. <!-- vale fix: Microsoft.We --> <!-- vale fix: Microsoft.QuestionMarks -->
3. **Pull cadence**: review upstream `main` on each release, quarterly, or only when the user asks. Recommendation: on user signal only, matching the @deessejs/* packages rule. <!-- vale fix: Microsoft.QuestionMarks -->
4. **Long-term posture**: stay as a fork forever, or design a path to merge back into the template (for example, apps/cli becomes an upstream addon). Worth re-evaluating annually. <!-- vale fix: Microsoft.Foreign --> <!-- vale fix: Microsoft.QuestionMarks -->
5. **Divergence catalog location**: `docs/internal/template-divergence.md` (suggested) or somewhere else. Trivial to decide later; just keep it next to other internal docs. <!-- vale fix: Microsoft.QuestionMarks -->
6. **Watch scope**: `github.com/deessejs/saas-template` only, or also `deessejs/saas-template-multi-tenant` (referenced in upstream README for the multi-tenant sister repo). Probably no (the fork is single-tenant by design), but worth confirming. <!-- vale fix: Microsoft.QuestionMarks -->

## Next steps

1. Review this plan; adjust Phase classifications if needed.
2. Phase 0: produce `docs/internal/template-divergence.md` (separate small task, not in this plan).
3. Phase 1: classify with the user.
4. Phase 2: set up GitHub Watch plus the short AGENTS.md subsection.
5. Phase 3: open the templates-endpoint PR once Phase 0-1 confirm the classification.
6. Phase 4: only when the user signals an upstream release worth pulling.
