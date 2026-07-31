# 3. External context (verified via fresh CLI, 2026-07-31)

[← Index](README.md) · **Prev: [02-problems.md](02-problems.md)** · **Next: [04-prereleases.md](04-prereleases.md)**

## 3.1 `@changesets/cli` is still on v2

`@changesets/cli@^2.31.0` is current. No v3 exists for the CLI. The companion `changesets/action` has a v2 in pre-release (`v2.0.0-next.3`, 2026-07-01) targeting changesets v3. **For our `@changesets/cli@^2.31.0`, the action must be pinned to `changesets/action@v1`** — not `@v2`. This is a non-obvious gotcha that is easy to miss when copying snippets from `changesets/action`'s README (which shows `@v2` in its examples as the future default).

## 3.2 npm trusted publishers — current state

- **GA since 2025-07-31** (over a year of stable operation).
- npm CLI v11.5.1+ required. Node v22.14.0+ required.
- Configuration is **per-package**, not per-org: each package gets exactly one trusted publisher. Path on npmjs.com is `https://www.npmjs.com/package/{name}/access` (not under `/settings/{username}/packages` — easy to miss).
- GitHub-hosted runners only (CircleCI and GitLab also supported). Self-hosted runners not yet supported.
- `id-token: write` permission is the only mandatory permission change beyond the workflow's existing needs.
- After enabling, npm strongly recommends restricting traditional token publishing ("disallow tokens"). Optional further hardening: allow `npm stage publish` only, requiring 2FA review per publish.

## 3.3 pnpm 11 publish is native

Since v11, `pnpm publish` no longer delegates to npm. It supports `--provenance`, `--access`, `--tag`, and a new `--batch` flag (v11.7.0+) for atomic multi-package publishes via the `pnpr` batch endpoint that npmjs.org implements. For a single-package CLI, `--batch` is not needed. Note: LICENSE file is picked up from the workspace root when publishing from inside a workspace, unless the package has its own.

## 3.4 changesets defaults (for reference)

From `changesets/changesets/docs/config-file-options.md`:

- `baseBranch: "master"`
- `updateInternalDependencies: "patch"` ← our recommendation matches the default
- `access: "restricted"` ← matches our current setting
- `privatePackages: { version: true, tag: false }` ← by default, private packages ARE version-bumped but NOT tag-published. We may want `{ version: false, tag: false }` to fully skip them — see [07-decisions.md](07-decisions.md) §2.5.
- `bumpVersionsWithWorkspaceProtocolOnly: false` ← for our setup, `workspace:*` is the right tool; we don't need this flag.

## 3.5 Known issues

- **changesets #1209** (open since 2023): changesets fails to detect pnpm workspaces if the `packages` globs end with `/`. Our `pnpm-workspace.yaml` uses `apps/*` and `packages/*` (no trailing slash) — not affected.
- **changesets #647** (open since 2021): no first-class Dependabot/Renovate integration. Convention is to hand-write `.changeset/*.md` markdown files. Acceptable for a repo with one public package and infrequent dep bumps.

## 3.6 Source list (external)

- [npm trusted publishers docs](https://docs.npmjs.com/trusted-publishers/)
- [GitHub Changelog: npm trusted publishing GA (2025-07-31)](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
- [Phil Nash: Things you need to do for npm trusted publishing to work (2026-01-31)](https://philna.sh/blog/2026/01/28/trusted-publishing-npm/)
- [npm provenance docs](https://docs.npmjs.com/generating-provenance-statements/)
- [pnpm publish docs (v11)](https://pnpm.io/cli/publish)
- [changesets/action README](https://github.com/changesets/action)
- [changesets config options](https://github.com/changesets/changesets/blob/main/docs/config-file-options.md)
- [changesets prereleases](https://github.com/changesets/changesets/blob/main/docs/prereleases.md)
- [PkgPulse: semantic-release vs changesets vs release-it 2026](https://www.pkgpulse.com/guides/semantic-release-vs-changesets-vs-release-it-release-2026)
- [changesets issue #1209 (pnpm workspaces detection)](https://github.com/changesets/changesets/issues/1209)
- [changesets issue #647 (Dependabot + changesets)](https://github.com/changesets/changesets/issues/647)
- [changesets discussion #1078 (pre-release transitions)](https://github.com/changesets/changesets/discussions/1078)