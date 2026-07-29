# 0001. giget as the template fetch primitive

- **Status:** Proposed
- **Date:** 2026-07-02
- **Deciders:** founder, tech lead

## Context and problem statement

The DeesseJS init CLI (`deesse init --template <url>`) needs to fetch a template from a remote source and extract it to a local directory. The source can be a GitHub URL, a `gh:` shorthand, a registered name (resolved through a local catalog), or — in the future — a private repo authenticated by token.

We have three concerns to balance:

1. **Provider coverage** — GitHub is the primary target, but the user might want to point at GitLab, Bitbucket, Sourcehut, or a self-hosted tarball. Re-implementing each provider's tarball format is wasted work.
2. **Offline experience** — A user who has scaffolded once may want to re-scaffold from cache without re-hitting the network. The CLI should not block on a fetch when the tarball is already on disk.
3. **Tarball extraction** — A template is often a subfolder of a larger repo (e.g. `gh:deessejs/templates/starter` extracts only `templates/starter/`). Handling this requires either sparse git checkout (slow, depends on local git) or tarball filter (fast, no local git needed).

The naive solution is to write a `fetch` + `tar` pipeline manually, like `create-next-app` does. The cost is the full surface of provider-specific URL formats, retry logic, caching, and subdir extraction. We've already paid that cost in research; the question is whether to pay it again in the DeesseJS CLI.

## Considered options

1. **Manual `fetch` + `tar`** — Same pattern as `create-next-app`. GitHub only at MVP. Add other providers as needed. Cache handled by a hand-rolled `~/.cache/deesse/` directory.
2. **`giget` (unjs)** — A zero-dependency library that handles all of the above. Used in production by Nuxt, Astro, Volt, and others. Maintained by the unjs org.
3. **`degit` (Rich Harris)** — The original "github tarball" scaffolder. Unmaintained since 2021 in favor of `giget`. Mentioned only for completeness — it is the wrong answer in 2026.

## Decision

**Option 2 — `giget`.** It's the de facto standard, zero-dependency, and abstracts exactly the surface we need.

The CLI uses `giget` as a black box:

```ts
import { downloadTemplate } from 'giget'

const { dir } = await downloadTemplate(source, {
  force: argv.force,
  cwd: process.cwd(),
  dir: targetDir,
  preferOffline: true,
  offline: argv.offline,
  install: false,  // we do install ourselves
  auth: process.env.GIGET_AUTH,
})
```

The CLI does not re-implement any of: provider detection, tarball URL composition, caching, retry, sparse extraction, or auth headers. It does add value on top: source resolution (URL → giget input string), error translation, post-process, install, and the outro.

## Why giget over manual fetch

- **Multi-provider support is built in.** GitHub, GitLab, Bitbucket, Sourcehut, and any custom tarball URL. We add support for "any provider giget supports" in 3 lines of config — without giget, it's 3 days per provider.
- **Offline cache is built in.** `~/.cache/giget/<provider>/<name>/<version>.tar.gz`. `--prefer-offline` reuses it. We get this for free.
- **Sparse extraction is built in.** `gh:deessejs/templates/starter` extracts only the `templates/starter/` subfolder, no local git needed.
- **Auth is built in.** `Authorization: Bearer <token>` from `GIGET_AUTH` env var. Same env var convention as giget itself.
- **Proven in production.** Nuxt, Astro, and ~30 other major tools use it. We are not the canary.
- **Zero dependencies.** giget is itself zero-dep. The CLI's dep tree stays small.

## Why giget over degit

- degit is unmaintained (last meaningful commit 2021).
- degit has no offline cache.
- degit is GitHub-only (no GitLab, Bitbucket, etc.).
- degit's author (Rich Harris) explicitly recommends giget as the successor.

## Consequences

**Positive:**

- Smaller CLI source (we don't write the fetch layer).
- Multi-provider support from day 1, not as a v0.x feature.
- Offline support from day 1.
- Less code to test, less code to maintain, less code to bug-fix.

**Negative:**

- External dependency (one more thing to track for CVEs). Mitigated by giget being zero-dep itself.
- We give up control of the fetch behavior. If giget's defaults are wrong for us, we have to work around them (the `install: false` workaround is an example).
- Cache location (`~/.cache/giget/`) is controlled by giget. We can hint but not dictate.

**Neutral:**

- The CLI's user-facing URL format is whatever giget accepts (`gh:`, `github:`, `gitlab:`, `https://...`). This is a stable surface (giget is API-stable).
- The error messages from giget are passed through our `error-translate.ts` layer to be human-friendly.

**Why we might revisit:**

- If giget's offline cache is ever incompatible with a CI environment (e.g. read-only filesystems, very restricted `HOME`), we may add a `--cache-dir` flag that points to a writable location. giget already supports this via the `GIGET_REGISTRY` and similar env vars; we'd just expose them.
- If giget is abandoned or stops being maintained, the migration path is to write our own fetch layer against `codeload.github.com` directly (the same path `create-next-app` took). The cost is ~200 LOC, manageable.
- If we ever want to ship a binary distribution (instead of an npm package), giget works fine in a Bun-compiled binary, so no change needed.

## References

- [`../research.md`](../research.md) — the full pattern study that led to this decision
- [`../architecture.md`](../architecture.md) — the proposed architecture that uses giget
- [unjs/giget on GitHub](https://github.com/unjs/giget) — the library
- [Nuxt's `nuxi init`](https://github.com/nuxt/cli/blob/main/packages/nuxi/src/commands/init.ts) — the reference implementation
- [Astro's `create-astro`](https://github.com/withastro/astro/blob/main/packages/create-astro/src/actions/template.ts) — the other reference implementation
