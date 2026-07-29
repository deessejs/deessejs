# 0002. CLI runtime and distribution

- **Status:** Accepted
- **Date:** 2026-06-17
- **Deciders:** founder, tech lead

## Context and problem statement

We need to decide three coupled things about the user-facing CLI (`apps/template/apps/cli/`):

1. **Workspace manager** for the whole monorepo.
2. **Runtime** the CLI is written for and executed with during development.
3. **Distribution format** the buyer ships to their end users (the CLI is user-facing — feature 9.1 — it talks to the buyer's deployed service).

The CLI is **not a scaffolder** and **not a deploy tool for the buyer**. The buyer customizes it and ships it to their own end users as part of their product. So the distribution format matters: every gram of friction for the end user is a friction for the buyer's product.

The constraints:

- Everything in the repo is TypeScript (consistency across template, SDK, CLI).
- We use Commander for argument parsing (user-confirmed in stack discussion).
- The CLI consumes `apps/template/packages/sdk/` to talk to the buyer's API (so we want type sharing).
- The buyer's end users may not have Node, Bun, or any specific runtime installed.

## Considered options

1. **pnpm workspaces + Bun runtime + single-file binary distribution.** pnpm manages the workspace. The CLI runs on Bun in dev and builds to a self-contained binary via `bun build --compile`. End users get a single executable file with no runtime dependency.

2. **pnpm workspaces + Node.js runtime + npm package distribution.** pnpm manages the workspace. The CLI runs on Node in dev and ships as an npm package (`npm i -g @buyer/cli`). End users need Node installed.

3. **Bun workspaces + Bun runtime + single-file binary distribution.** Bun has its own workspace manager (`bun install` with `bunfig.toml`). The CLI runs on Bun. Builds to single-file binary. The whole repo would use Bun tooling.

4. **Go binary.** Single-file binary, fastest possible startup, but breaks TypeScript type sharing with the SDK — we'd need to maintain types in two languages.

5. **Rust binary.** Same as Go, more so.

## Decision

**Option 1.** pnpm manages the entire workspace. Bun is the runtime **only for the CLI sub-app** (`apps/template/apps/cli/`). The CLI is distributed as a single-file binary via `bun build --compile`. Everything else in the repo (Next.js apps, Fumadocs, background jobs, SDK building) runs on Node.js.

The CLI package's `package.json`:

```json
{
  "name": "@deessejs/cli",
  "type": "module",
  "bin": {
    "deessejs": "./dist/deessejs"
  },
  "scripts": {
    "dev": "bun --hot run src/index.ts",
    "build": "bun build --compile --outfile=dist/deessejs src/index.ts",
    "build:all": "bun build --compile --outfile=dist/deessejs src/index.ts"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "@deessejs/sdk": "workspace:*"
  }
}
```

The CI matrix produces four binaries per release (linux-x64, darwin-x64, darwin-arm64, windows-x64) and attaches them to the GitHub release.

## Why pnpm (not Bun workspaces)

- pnpm is the more mature, widely-deployed workspace manager.
- pnpm's content-addressable store avoids the duplicate-deps problem common with npm and yarn.
- pnpm has better support for monorepo tooling (Turborepo, Nx, etc.).
- Bun workspaces exist but are less battle-tested. Using Bun only as a runtime keeps the workspace layer conservative.

## Why Bun for the CLI runtime (not Node)

- Startup time matters for a CLI: `bun --hot run src/index.ts` boots in ~10ms vs ~100ms for Node with tsx. The dev loop is noticeably tighter.
- TypeScript native: no build step, no ts-node, no tsx.
- `bun build --compile` produces a self-contained single-file binary. This is the killer feature for end-user distribution: the buyer's end users download one file, chmod +x, done. No Node install, no PATH gymnastics.
- Bun is API-compatible with Node for the parts we need (Commander, fetch, file system).

## Why single-file binary (not npm package)

The CLI is user-facing for the **buyer's** end users, not for developers. Those end users may be designers, ops folks, or non-technical power users. Asking them to `npm i -g @buyer/cli` and have Node installed is a barrier. A binary they download and run is the lowest-friction distribution.

The trade-off: binaries are larger than an npm package and harder to update (no auto-update without extra work). For a buyer-distributed CLI where updates are part of the buyer's release cadence (not ours), the binary is the right call.

## Consequences

**Positive:**

- End users (buyer's customers) install the CLI with zero friction: download binary, chmod, run.
- Dev loop on the CLI is fast (`bun --hot`).
- Type sharing between SDK and CLI works: the CLI imports `@deessejs/sdk` from the workspace, all in TypeScript.
- pnpm's robustness applies to the rest of the repo.

**Negative:**

- Two tools to learn (pnpm + Bun) instead of one. The team needs to know Bun-specific quirks for the CLI package only.
- The CI matrix produces 4 binaries per release (4 architectures). More CI minutes, more release artifacts to upload.
- Bun is localized to the CLI sub-app. If we ever want Bun elsewhere, we'd have multiple Bun use sites with potentially different configurations.

**Neutral:**

- The CLI's `dev` command (`bun --hot`) is not portable to a non-Bun environment. New contributors must install Bun to work on the CLI.

**Why we might revisit:**

- If `bun build --compile` proves unreliable for one of the target platforms (e.g. ARM Linux), we may need a Node fallback distribution for that platform.
- If Bun's API surface diverges from Node in a way that breaks the SDK import, we may need to migrate the CLI runtime to Node (with the startup cost).
- If the team grows and Bun familiarity varies, we may standardize on Node everywhere for the team and use Bun only as the build tool (no `bun run` in dev).

## References

- [`../01-stack/commander.md`](../01-stack/commander.md) — the CLI argument-parsing library.
- [`../01-stack/bun.md`](../01-stack/bun.md) — the Bun runtime rationale and scope.
- [`../../product/features/09-cli.md`](../../product/features/09-cli.md) — the CLI feature inventory.
- [`../../product/open-questions.md`](../../product/open-questions.md) — the original P1 about CLI language, now closed by this ADR.
- [`0012-template-as-pattern.md`](./0012-template-as-pattern.md) — the sub-app pattern, including the CLI sub-app.