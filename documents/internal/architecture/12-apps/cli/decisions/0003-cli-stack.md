# 0003. CLI stack: mri + clack + giget + nypm + detect-agent

- **Status:** Proposed
- **Date:** 2026-07-02
- **Deciders:** founder, tech lead

## Context and problem statement

The init CLI is a small Node.js program whose **primary audience is AI coding agents**. It needs five capabilities, each of which has at least two well-known libraries as candidates:

1. **Argument parsing** — `commander`, `mri`, `yargs`, `citty`, hand-rolled
2. **Interactive prompts** — `prompts`, `inquirer`, `@clack/prompts` (deprioritized for agents)
3. **Tarball fetch** — `giget` (covered in [decision 0001](./0001-giget-as-fetch-primitive.md))
4. **Package-manager install** — `nypm`, hand-rolled per-PM, `execa` + `cross-spawn`
5. **AI agent detection** — `@vercel/detect-agent`, roll-our-own env sniffing

The agent-first thesis (per [architecture §agent-first-contract](../architecture.md#agent-first-contract)) means the stack choices are biased toward libraries that produce **structured, parseable, non-blocking** output over libraries that produce beautiful interactive UX.

The stack choices are coupled: the more libraries we add, the larger the install footprint, but the less we have to maintain. The CLI will be run by `npx` users (humans and agents) who care about install time and disk footprint.

## Considered options

For each capability, the candidate libraries with their 2026 maintenance status and a one-line verdict.

### Argument parsing

| Library | Verdict |
|---|---|
| `commander` | Mature, 12.x, used by `create-next-app` and `create-t3-app`. ~100 KB unpacked. Sub-command support. |
| `mri` | Tiny (~1 KB), zero-dep. Used by `create-vite`. Single-level only, no sub-commands. |
| `yargs` | Mature but heavy. Many transitive deps. Overkill for one command. |
| `citty` | Modern, unjs org, used by `nuxi`. ~10 KB. Sub-command support. |
| Hand-rolled | 20 LOC. Loses `--help` formatting and validation. |

**Choice: `mri`.** The CLI has one command at MVP. Adding a second is unlikely. `mri` is the leanest viable option, and `create-vite`'s CLI is the closest reference.

If we ever add a second command, we migrate to `citty` (also unjs, so the migration is cheap). Documented in the "Why we might revisit" section.

### Interactive prompts

| Library | Verdict |
|---|---|
| `prompts` | The 2018-era standard. Used by `create-next-app` and `shadcn`. No longer actively maintained. |
| `inquirer` | Heavy. 14 transitive deps. Many features we don't need. |
| `@clack/prompts` | The 2024+ standard. Used by `create-vite`, `create-t3-app`, `nuxi`. Beautiful UI, cancel handling, spinner, group. ~50 KB unpacked. |

**Choice: `@clack/prompts`.** The de facto standard, used by every recent senior CLI. Cancel handling is built in (T3 and Vite both rely on it). The slight size cost is worth the DX win.

### Tarball fetch

Covered in [decision 0001](./0001-giget-as-fetch-primitive.md). **Choice: `giget`.**

### Package-manager install

| Library | Verdict |
|---|---|
| `nypm` | unjs, used by `nuxi` and `create-t3-app`. Detects PM, calls the right command. ~10 KB. |
| Hand-rolled | `execa` + `cross-spawn` + a matrix of `getInstallCommand(pm)`. ~50 LOC. More flexible, more code to maintain. |
| `execa` + `cross-spawn` only | Same as hand-rolled but reuses the libraries. Loses the PM-detection logic. |

**Choice: `nypm`.** Same unjs ecosystem as `giget`. PM detection is built in. We're not building a CLI that's so PM-specific that we need our own matrix.

### AI agent detection (CORE, not optional)

| Library | Verdict |
|---|---|
| `@vercel/detect-agent` | 1.x, used by Vite 6+. Tiny, single function. Maintained by Vercel alongside the agent ecosystem it serves. |
| Roll-our-own | Check `process.env.CLAUDE_CODE` or similar. Brittle. Misses new agents. |

**Choice: `@vercel/detect-agent` — promoted from nice-to-have to core dependency.**

Why this is no longer a "5-line addition":

- The CLI's **primary audience is agents**. The detection isn't a UX hint, it's a routing decision. When `isAgent()` returns true, the CLI changes behavior (auto-fills env defaults, suppresses any future prompts, prints a different outro).
- The DeesseJS positioning is agent-first SaaS template. A CLI that doesn't know it's being run by an agent is shipping incomplete tooling.
- Vite added this in 6.x and the docs are explicit about the use case: "an agent that doesn't know the non-interactive form will re-run interactively and break."

The detection flows into three places in the CLI:

1. **Top-of-stderr hint** (Vite 6+ pattern): print the non-interactive form upfront, so an agent that doesn't know the flags can copy them.
2. **Default-fill from `DEESSE_*` env vars**: when an agent is detected, additional env vars are read to populate defaults (`DEESSE_TEMPLATE`, `DEESSE_PORT`, `DEESSE_ORG`, etc.). A coding-agent platform can set these once and every invocation inherits them.
3. **Future-proofing**: if we ever add a second command, the agent mode auto-routes to non-interactive variants. The detection is the routing primitive.

If the package is abandoned, we can replace it with a hand-rolled check against known env vars (`CLAUDE_CODE`, `CURSOR_TRACE_ID`, etc.) for ~20 LOC. The migration is contained.

## Final stack

```json
{
  "dependencies": {
    "mri": "^1.2.0",
    "@clack/prompts": "^1.6.0",
    "giget": "^2.0.0",
    "nypm": "^0.6.0",
    "cross-spawn": "^7.0.6",
    "picocolors": "^1.1.1",
    "@vercel/detect-agent": "^1.2.0",
    "validate-npm-package-name": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tsx": "^4.0.0",
    "vitest": "^2.0.0",
    "nock": "^14.0.0",
    "@types/node": "^22.0.0",
    "@types/cross-spawn": "^6.0.0"
  }
}
```

**8 runtime dependencies.** All in the unjs ecosystem (giget, nypm) or the Vercel/standard ecosystem (mri, clack, picocolors, detect-agent). Zero overlapping functionality. Every dep justifies its place.

## Why the unjs ecosystem matters

Four of our deps (`giget`, `nypm`, `picocolors`-adjacent, `cross-spawn`-adjacent) are maintained by the [unjs](https://github.com/unjs) org or closely related (Pooya Parsa, Daniel Roe). Nuxt, Nitro, and the broader Nuxt ecosystem all use these. We're piggybacking on a maintenance collective that has been running since 2018.

The risk: if unjs folds, our deps lose their maintainers. The mitigation: each library is small enough to fork or replace individually. None of them is load-bearing on the others (no internal cross-deps).

## Why `@clack/prompts` is in the stack even though agents don't use it

`@clack/prompts` is on the dep list but **the MVP never calls it**. Why include it then?

- **Human escape hatch.** The CLI is agent-first, not agent-only. A human running the CLI in a terminal — for development, debugging, or just preference — gets the clack UX if we ever add a flow that needs input (none at MVP, but `--template` validation or token resolution in v0.2 might).
- **Future flag-mirror prompts.** Some flags might benefit from an interactive picker that mirrors the flag (e.g. `deesse init --pick-template` shows a list, `deesse init --template=foo` skips it). The dep is in the bundle so the v0.2 work doesn't add a new dep.
- **Cost is bounded.** ~50 KB unpacked, single transitive dep (`is-unicode-supported`). The size is acceptable for the future flexibility.

If the dep ever becomes a maintenance burden (it's not in 2026), drop it. The MVP doesn't use it.

## Why not Bun + single binary (like the buyer-facing CLI)

The buyer-facing CLI in `apps/template/apps/cli/` is a Bun single-binary, per [system ADR 0002](../../10-decisions/0002-cli-runtime-and-distribution.md). **The init CLI is not.**

Reasons:

- The init CLI is for **developers**, not for end users. Developers have Node installed (or know how to install it). The single-binary DX win is for non-developers.
- The init CLI is **published on npm**, not distributed as a GitHub release artifact. `npx deesse@latest` is the install path. A binary would mean a separate `deesse-mac`, `deesse-linux`, etc. — more friction, not less.
- The init CLI's runtime dep tree (8 libs) is small. Bun's compile-time win on small programs is marginal.
- The init CLI consumes `giget` and `nypm`, both of which are tested on Node. Running them in Bun is possible but adds a runtime we don't otherwise need.

The single-binary pattern is the right call for the buyer-facing CLI (deployed to non-developer end users via GitHub releases). The npm-package pattern is the right call for the init CLI (consumed by developers via `npx`).

## Consequences

**Positive:**

- Small, focused dep tree. No overlap, no dead weight.
- Every library is the 2026 standard for its concern. We are not the canary.
- Stack is consistent with Vite, T3, Nuxt, Astro. Anyone familiar with one is familiar with all of them.
- AI-agent friendly from day 1: detect-agent is core, JSON output mode, semantic exit codes, env-based defaults.
- Easy to maintain: each library has a clear upgrade path, none of them are abandoned.

**Negative:**

- We adopt dependencies on third-party libraries (giget, clack, nypm, etc.). Each is a risk surface.
- `@clack/prompts` is ~50 KB unpacked. The largest single dep. Worth it for the DX, but it's the one to watch if size ever becomes a concern.
- If the unjs ecosystem folds, we have a 4-library migration on our hands. The migration is mechanical (each lib is replaceable individually) but it's still a quarter-day of work.

**Neutral:**

- We use the same stack as Nuxt and Astro. If a future contributor has Nuxt or Astro experience, they know our CLI.
- We don't use the same stack as the buyer-facing CLI (which is Bun + commander). The two CLIs are in different repos with different audiences; this is fine.

**Why we might revisit:**

- If a second command is added (`deesse check`, `deesse update`), migrate `mri` → `citty` for sub-command support. The migration is a half-day.
- If `@clack/prompts` is abandoned, fall back to `prompts` (the legacy but still-maintained lib). DX regression is acceptable for a temporary period.
- If the unjs ecosystem loses a maintainer, we may replace `giget` + `nypm` with a hand-rolled equivalent. Cost: ~3 days, ~200 LOC. Not blocking, but on the watch list.

## References

- [decision 0001](./0001-giget-as-fetch-primitive.md) — the giget decision
- [decision 0002](./0002-cli-as-external-published-package.md) — the standalone-repo decision
- [`../research.md`](../research.md) — the senior CLI pattern study
- [`../architecture.md`](../architecture.md) — how the stack is used
- [create-vite `package.json`](https://github.com/vitejs/vite/blob/main/packages/create-vite/package.json) — the closest reference for our dep set
- [nuxi `package.json`](https://github.com/nuxt/cli/blob/main/packages/nuxi/package.json) — the other closest reference
- [System ADR 0002](../../10-decisions/0002-cli-runtime-and-distribution.md) — the **buyer-facing** CLI stack (Bun + commander) for contrast
