# 4. Pre-release channels

[← Index](README.md) · **Prev: [03-external-context.md](03-external-context.md)** · **Next: [05-strategy.md](05-strategy.md)**

## Decision, not needed for V1 <!-- vale fix: Microsoft.HeadingColons -->

Changesets supports `pre enter <tag>` / `pre exit` to publish `-alpha.N` / `-beta.N` / `-rc.N` versions on a separate `next` npm dist-tag. The changesets docs themselves warn:

<!-- vale off -->
<!-- Verbatim quote from the changesets docs. Do not reword to satisfy style
     rules: Microsoft.Adverbs, proselint.Very, write-good.Weasel and
     Microsoft.We all fire on the original wording, which must stay exact. -->

> Prereleases are very complicated! Using them requires a thorough understanding of all parts of npm publishes. Mistakes can lead to repository and publish states that are very hard to fix.
>
> We thoroughly recommend only running prereleases from a branch other than the default branch.

<!-- vale on -->

For `@deessejs/cli` V1, pre-releases add operational risk without payoff. **Decision: stick with `latest` only.** Revisit when (if) the CLI ever needs an opt-in beta channel for breaking changes.

> **Superseded (2026-08-21):** [ADR-021](../../../../apps/internal-documentation/content/docs/decisions/ADR-021-cli-three-tier-release.mdx) revives this deferral with a `@canary` channel implemented as a `workflow_dispatch` branch of `release.yml`, plus per-PR ephemeral previews via pkg.pr.new. ADR-021 §"Alternatives considered" §A documents why changesets `pre enter canary` was still rejected; the implementation bypasses changesets' pre-release mode entirely.

## Background (kept for reference)

For context, here's how changesets pre-releases work when enabled:

```bash
# Enter pre-release mode (creates .changeset/pre.json)
pnpm changeset pre enter next

# Each version bump produces 0.1.1-next.0, 0.1.1-next.1, etc.
pnpm changeset version
pnpm changeset publish   # publishes to the `next` npm dist-tag

# Exit pre-release mode
pnpm changeset pre exit
pnpm changeset version   # removes the -next.N suffix, e.g. 0.1.1
pnpm changeset publish   # publishes to `latest`
```

Caveats (from the official docs):

- Pre-releases block other releases on the same branch until you exit pre mode.
- Switching between pre-release tags (for example `alpha` → `beta`) isn't officially supported and has been an open Q&A since 2023 ([discussion #1078](https://github.com/changesets/changesets/discussions/1078)). <!-- vale fix: Microsoft.Foreign + Microsoft.Contractions -->

- New packages published during a pre-release get the `latest` dist-tag (not the pre-release tag) on their first publish, which is surprising and worth documenting.

## When to revisit

- If `@deessejs/cli` ever introduces a breaking-change opt-in (for example a new major version that requires user migration): use `pnpm changeset pre enter next`, publish pre-releases, then `pre exit` when stable. <!-- vale fix: Microsoft.Foreign -->

- If the team adopts internal dogfooding: a `next` dist-tag can be useful for staging environments that want unreleased CLI features.

For V1, none of these apply.