# Bun

## Decision

**Bun** as the JavaScript/TypeScript runtime **only for the CLI sub-app** (`apps/template/apps/cli/`). Everything else in the repo runs on Node.js.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## Scope (where Bun is used)

Bun is **localized** to the CLI. Specifically:

- `apps/template/apps/cli/` — runtime and build tool.
- The compiled single-file binary the buyer ships to their end users (produced by `bun build --compile`).

Bun is **not** used for:

- The web apps (`apps/template/apps/web/`, `apps/web/`, `apps/docs/`, `apps/demo/`) — these run on Node via Next.js.
- The docs/blog (`apps/template/apps/docs/`) — Node via Fumadocs.
- Background jobs (`apps/template/packages/jobs/` or wherever it lands) — Node via Trigger.dev.
- The SDK building pipeline — Node.
- The package manager — pnpm, not Bun's installer.

## What Bun gives us in the CLI

1. **Fast startup in dev.** `bun --hot run src/index.ts` boots in ~10ms. The dev loop on the CLI is noticeably tighter than `tsx watch` on Node (~100ms).
2. **TypeScript native.** No build step, no ts-node, no tsx. Bun parses TS directly.
3. **Single-file binary via `bun build --compile`.** The killer feature for our use case. The CLI is user-facing for the buyer's end users; a self-contained binary removes the runtime dependency from their install path.
4. **Node API compat.** Commander, fetch, fs, path — all work. The SDK import works.
5. **Smaller CI matrix overhead.** Bun compiles for linux-x64, darwin-x64, darwin-arm64, windows-x64 with one command.

## Why not Bun globally

- **Maturity.** Bun is younger than Node. The Node ecosystem has more battle-tested packages and edge cases documented.
- **Next.js compat.** Next.js works on Bun but is less common in production. We don't want to debug Bun-specific issues during a v1 launch.
- **Ecosystem.** Some npm packages have native bindings (sharp, sqlite, etc.) that don't always work under Bun. For Next.js apps, this risk is real.
- **Team familiarity.** Bun-specific quirks (`bun:sqlite`, `Bun.serve`, etc.) add a learning curve. Confining Bun to one sub-app keeps the surface area small.

## Why not pure Node for the CLI

- Node startup is slower (~100ms vs ~10ms with Bun). For a CLI that's called many times per session, this adds up.
- No native single-file binary story. We'd need pkg, nexe, or similar — none of which are first-party Node.
- TypeScript execution requires tsx or similar, adding friction.

The trade-off is clear: the CLI is the **one** place where Bun's advantages are large enough to justify its inclusion.

## Alternatives considered

| Alternative | Why not |
|---|---|
| **Node.js everywhere** | Loses Bun's dev-loop speed and single-file binary story for the CLI. |
| **Deno** | Smaller ecosystem than Bun, less npm compat, no first-class `bun build --compile` equivalent. |
| **Bun globally** | Same benefits as Bun for CLI, plus less Next.js maturity on Bun. The team has to learn Bun quirks for everything. |
| **Deno globally** | Same as above, worse npm compat. |
| **Node + pkg for the CLI binary** | pkg is unmaintained, produces large binaries, has runtime quirks. `bun build --compile` is strictly better. |

## The build pipeline

```bash
# Development
cd apps/template/apps/cli
bun --hot run src/index.ts

# Build for one target
bun build --compile --target=bun-linux-x64 --outfile=dist/deessejs src/index.ts

# Build for all targets (CI does this in parallel)
bun build --compile --outfile=dist/deessejs src/index.ts
```

The resulting `dist/deessejs` is a self-contained executable. End users:

```bash
curl -O https://github.com/<buyer>/<buyer-repo>/releases/download/v1.0.0/deessejs-darwin-arm64
chmod +x deessejs-darwin-arm64
mv deessejs-darwin-arm64 /usr/local/bin/deessejs
deessejs --help
```

No Node, no Bun, no npm. Just one file.

## CI matrix

Per release of `apps/template/apps/cli/`, the CI produces four binaries and uploads them to the GitHub release:

| Target | Binary name |
|---|---|
| linux-x64 | `deessejs-linux-x64` |
| darwin-x64 | `deessejs-darwin-x64` |
| darwin-arm64 | `deessejs-darwin-arm64` (Apple Silicon) |
| windows-x64 | `deessejs-windows-x64.exe` |

The release manager (per `process/release-process.md`) attaches these binaries to the GitHub release. The buyer's deploy step downloads the right one based on the user's OS.

## Constraints

- **Bun is not a project-wide runtime.** Don't `bun --bun next dev` on the web apps. Don't add Bun-specific APIs (`Bun.file`, `Bun.serve`) to shared code in `apps/template/packages/*`.
- **Bun version pinning.** Lock to a specific Bun version in `apps/template/apps/cli/package.json` (`engines.bun`) and in CI to avoid drift between dev and build.
- **No Bun-specific npm workarounds in shared packages.** If the SDK needs to work in both Node and Bun, it uses pure Web/Node APIs (no `node:fs`, no `bun:sqlite`).

## Cross-references

- [`../10-decisions/0002-cli-runtime-and-distribution.md`](../10-decisions/0002-cli-runtime-and-distribution.md) — the full ADR for Bun + binary + pnpm.
- [`commander.md`](./commander.md) — the CLI library, Bun-compatible.
- [`../../product/features/09-cli.md`](../../product/features/09-cli.md) — the CLI feature inventory.