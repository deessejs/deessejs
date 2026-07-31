---
name: feedback-senior-release-pattern
description: User wants release engineering to be a set-and-forget concern. One source of truth, one workflow, one mental rule. Avoid patterns that require manual intermediate steps.
metadata:
  type: feedback
---

When designing or reviewing release/versioning infrastructure in this repo, optimize for **"don't worry about release engineering"**. The maintainer should not need to think about releases day-to-day.

**What this means in practice:**

- One source of truth (changesets, not hand-managed VERSION + CHANGELOG + tag triples)
- One workflow (not dual-flow release.yml + publish-cli.yml with cross-coupled commit-message filters)
- One mental rule per actor (e.g. "contributor adds a changeset if they changed the CLI surface — that's the only thing they need to know")
- No manual intermediate steps (no "edit VERSION before merging", no "promote staging → main then watch two workflows fire")
- Edge cases (hotfix, yank) handled with the same primitives as normal releases, not separate code paths

**Why:** Stated by the user on 2026-07-31 during the versioning audit review, after I delivered a dual-flow design (audit files `versioning/05-strategy.md`, `versioning/06-implementation-specs.md`, `versioning/08-execution-plan.md`): "Il nous faut un pattern senior, le but du travail ici est de comprendre comment ne plus se soucier du release engineering." A dual-flow design that requires a human to bump root VERSION for the first release, memorize two workflow behaviors, and chain staging → main → two workflow triggers is "engineering tax" that doesn't pay for itself for one published package.

**How to apply:**

- When proposing a versioning/release mechanism, write down the "things a maintainer must remember" list. If more than 1 item is on it, propose a simpler design.
- When the audit produces dual flows, manual sync steps, or string-matching triggers, flag them as candidates for collapse.
- Prefer changesets' built-in `version` + `publish` commands over rolling our own. `changesets/action@v1` exists for a reason — the maintainer-reviewed happy path.
- Don't be precious about legacy conventions (e.g. `template/v*` tags inherited from upstream). If dropping them simplifies the design, drop them.
- The yank workflow stays manual because it requires human judgment. Everything else should be automatable.

**Related:** [[release-pipeline]] (current dual-flow architecture), [[templates-content-not-cli]] (decoupling that was already correct).