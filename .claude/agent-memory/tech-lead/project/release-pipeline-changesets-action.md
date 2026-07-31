---
name: release-pipeline-changesets-action
description: changesets/action has v1 (changesets v2) and v2-pre (changesets v3); pin the right one or the action silently uses the wrong CLI version.
metadata:
  type: project
---

The `changesets/action` GitHub Action has two major versions:

- **`changesets/action@v1`** — targets `@changesets/cli@^2.x`. Maintenance branch.
- **`changesets/action@v2`** — currently in pre-release (`v2.0.0-next.3`, 2026-07-01). Targets `@changesets/cli@^3.x` (which does not exist publicly yet).

**The action's own README shows `@v2` in its example workflows** — but the v2 action is for a future CLI major version. Copying the example as-is silently uses the wrong pairing.

**Why:** For our `@changesets/cli@^2.31.0` (verified 2026-07-31, still on v2 with no v3 in sight), the action MUST be pinned to `changesets/action@v1`. The 2026-07-31 audit (`docs/engineering/reports/versioning-strategy-audit-2026-07-30.md`) decided **not** to use `changesets/action` at all in favor of a custom workflow that calls `pnpm changeset publish` directly — see [[release-pipeline]]. If a future contributor chooses to add `changesets/action` anyway, they must pin `@v1`.

**How to apply:** Whenever anyone proposes a `changesets/action@v2` example in this repo, flag it as wrong for our setup. Verify by checking the catalog `@changesets/cli` version first; if it's still `^2.x`, pin the action to `@v1`.