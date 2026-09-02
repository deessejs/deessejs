# Changesets

This directory holds changesets for `@deessejs/cli` releases. See [docs/engineering/processes/versioning.md](../docs/engineering/processes/versioning.md) for the full operational process.

## What is a changeset?

A changeset is a short Markdown file that describes a single change to a published package. When `pnpm changeset version` runs (triggered by `release.yml` on push to `main`), changesets are consumed, version bumps are applied, and a changelog entry is generated.

In this repo, **only `@deessejs/cli` is published to npm**. All other workspace projects are `private: true` and ignored by changesets for publishing. You only need a changeset if your PR touches the CLI's published surface.

## When to add one

Add a changeset when your PR:

- Adds a new command or flag to `@deessejs/cli`.
- Changes the behavior of an existing command in a user-visible way.
- Fixes a bug that consumers would notice.
- Removes or renames something (breaking change).

Skip the changeset when your PR:

- Only touches internal packages (`packages/*`), other apps, or `apps/cli/test/**`.
- Only updates docs, comments, or formatting in `apps/cli/**`.
- Bumps a catalog dependency without changing how the CLI is invoked (e.g. `commander` from `^12.1.0` to `^12.2.0` with no API change).
- **Adds, updates, or removes a template entry** in `packages/api/src/templates.ts` (or any future database table backing the templates endpoint). Templates are content served by an API; the CLI is a client. See [docs/engineering/reports/versioning/11-templates-not-cli.md](../docs/engineering/reports/versioning/11-templates-not-cli.md) for the full reasoning and edge cases.

If unsure, look at recent merged PRs to `apps/cli/**` on GitHub — they should each carry a changeset.

## Format

A changeset is a Markdown file in `.changeset/` with a unique slug. The filename doesn't matter; changesets reads the frontmatter.

```markdown
---
"@deessejs/cli": <patch | minor | major>
---

One-sentence description of the change, written for consumers.
```

### Bump types

| Type | When to use | Example |
|---|---|---|
| `patch` | Bug fix, internal refactor with no API change | `fix: handle empty template list gracefully` |
| `minor` | New command, new flag, backward-compatible addition | `feat: add --json flag to deessejs info` |
| `major` | Breaking change to command behavior, removed flag, changed default | `feat!: change deessejs init default branch from main to staging` |

### Examples

**Patch:**

```markdown
---
"@deessejs/cli": patch
---

Fix `deessejs list --json` returning an empty array instead of an error when the API is unreachable.
```

**Minor:**

```markdown
---
"@deessejs/cli": minor
---

Add `deessejs list --category <name>` flag to filter templates by category.
```

**Major:**

```markdown
---
"@deessejs/cli": major
---

Remove deprecated `deessejs init --legacy` flag. Use the new `--ref` flag instead.
```

## How to add one

**Interactive (recommended for first-timers):**

```bash
pnpm changeset
```

The CLI walks you through selecting the package, bump type, and message. It writes a new file under `.changeset/` for you to commit.

**Manual:**

1. Create a new file in `.changeset/`, e.g. `.changeset/cool-tigers-jump.md`.
2. Write the frontmatter and message as shown above.
3. Commit the file alongside your code changes.
4. Open the PR. CI verifies the changeset is present (if the PR touches `apps/cli/**`).

## Lifecycle

1. You commit the changeset file with your code change.
2. PR is reviewed and merged to `staging`. `changesets-check.yml` (required status check) confirms the changeset is present before merge is allowed.
3. Pushing to `staging` triggers `release.yml` in `@canary` mode (per [ADR-025](../apps/internal-documentation/content/docs/decisions/ADR-025-auto-canary-on-staging.mdx)). The canary path bypasses `pnpm changeset version` entirely — your changesets stay intact.
4. Human promotes `staging` → `main` (per `AGENTS.md`).
5. `.github/workflows/release.yml` runs on `main` in `@latest` mode:
   - `pnpm changeset version` reads all `.changeset/*.md` files, bumps `apps/cli/package.json#version` per the frontmatter, and regenerates `apps/cli/CHANGELOG.md`. The bump is committed locally on the runner with `commit: true` in `.changeset/config.json`.
   - The changesets are now "consumed" on the runner. **The bump commit and the deletion of the `.changeset/*.md` files are not pushed to `origin/main`** — the ruleset `protect main` (id 20040100) refuses direct pushes from `github-actions[bot]` with GH013. See [ADR-027](../apps/internal-documentation/content/docs/decisions/ADR-027-version-bump-orphan.mdx) for the rationale.
   - `pnpm changeset publish` publishes the new version to npmjs.org with provenance (via trusted publisher + OIDC). The published version on npm is the source of truth.
   - `git tag -f release/v{VERSION}` and `gh release create` provide the GitHub Release.
6. The next `staging` → `main` promotion re-runs `pnpm changeset version` against the same changesets (still present on `staging`). This re-aligns `apps/cli/package.json#version` on `main` with the npm `@latest` version. See ADR-027 §"Consequences" for the orphan behavior and its mitigations.
7. The new version of `@deessejs/cli` is live.

## Common mistakes

- **Forgetting the frontmatter**: the file must start with `---` and contain `"@deessejs/cli": <bump>`. Plain Markdown without frontmatter is ignored.
- **Wrong package name**: must be exactly `@deessejs/cli`. Any other name is silently ignored (no error, no publish).
- **Implementation-detail messages**: write for consumers, not for maintainers. "Refactor: extract helper function" is bad; "Faster list output for large registries" is good.
- **Multiple changesets for one PR**: prefer one changeset per PR with a single summary line. Multiple changesets for one PR result in multiple version bumps if not consumed together.
- **Bump type too high**: `major` for a backward-compatible change breaks consumers. When in doubt, `minor` is safer than `major`.

## See also

- [docs/engineering/processes/versioning.md](../docs/engineering/processes/versioning.md) — full operational process.
- [CONTRIBUTING.md](../CONTRIBUTING.md) — contributor workflow.