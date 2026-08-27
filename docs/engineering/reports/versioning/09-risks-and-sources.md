# 9. Risks, rollback, and sources

[← Index](README.md) · **Prev: [08-execution-plan.md](08-execution-plan.md)** · **Next: [11-templates-not-cli.md](11-templates-not-cli.md)**

## 9.1 Risks and rollback

- **Risk: someone forgets a changeset.** Mitigated by [08-execution-plan.md](08-execution-plan.md) PR 2's `changesets-check.yml` workflow.
- **Risk: `pnpm changeset publish` publishes the wrong package.** Mitigated by `private: true` on every other workspace and `publishConfig` only on `apps/cli`. With the senior pattern (single workflow, no manual `publish-cli.yml`), this becomes a one-time setup risk rather than an ongoing one.
- **Risk: trusted publisher not configured → publish silently falls back to NPM_TOKEN (which doesn't exist).** This will fail loudly. If maintainers want a fallback path, add a manual `workflow_dispatch` job that runs `pnpm changeset publish` with a maintainer-supplied `NPM_TOKEN` secret. **Decision pending**.
- **Risk: a hotfix is needed and `release.yml` is broken.** Manual fallback in [06-implementation-specs.md §6.4](06-implementation-specs.md#64-manual-fallback-unchanged-from-dual-flow-draft): copy/paste from the workflow.
- **Risk: yank a bad version.** `pnpm unpublish @deessejs/cli@x.y.z` (npm allows within 72h). For yanks after 72h, use `npm deprecate` with a clear message.
- **Risk: divergence from upstream `deessejs/saas-template`.** The release workflow is fork-specific. Per the `saas-template-divergence.md` plan, this falls under Phase 4 (pull cycle) and won't conflict with upstream sync as long as the new `release.yml` and `.changeset/config.json` changes are categorized as locked-local in the divergence catalog.

## 9.2 Internal sources

Read directly during this audit:

- All `apps/*/package.json` and `packages/*/package.json`
- `.changeset/config.json`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `.github/CODEOWNERS`
- `pnpm-workspace.yaml`
- `apps/cli/tsup.config.ts`, `apps/cli/README.md`
- `apps/cli/dist/` (verified contents)
- `packages/api/CHANGELOG.md` (verified changesets format)
- `docs/engineering/plans/saas-template-divergence.md`
- `CONTRIBUTING.md`
- `AGENTS.md`
- `turbo.json`

## 9.3 External sources

Fetched via fresh CLI 2026-07-31:

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