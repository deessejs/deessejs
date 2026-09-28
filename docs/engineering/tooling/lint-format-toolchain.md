# Lint and format toolchain

Status: Phase 1 of [ADR-031](../../architecture/decisions/ADR-031-lint-format-toolchain.md) is
shipped. ESLint + Prettier remain the gating tools. Oxlint runs in parallel as an
informational signal.

## Tooling layout

```
.
├── .eslintrc.js                  # Root ESLint flat config (gate)
├── .prettierrc                   # Prettier config (used by apps/* format scripts)
├── .prettierignore
├── .oxlintrc.json                # Oxlint root config (informational)
└── package.json
    scripts:
      lint          → pnpm turbo lint -- --max-warnings=0   # ESLint gate
      lint:oxlint   → oxlint .                               # info-only
      format        → pnpm turbo format                       # Prettier (per workspace)
```

`pnpm run lint` is the single blocking gate today. `pnpm run lint:oxlint` is the
Phase 1 informational runner. The two are independent.

## Phase 1 — Oxlint in parallel

What it does:

- Installs `oxlint` at the catalog version (currently `^1.86.0`).
- Adds `.oxlintrc.json` at the repo root enabling `correctness`, `suspicious`,
  `perf`, and `style` categories. `style` is at `warn`, the other three at
  `error`.
- Adds the `oxlint` binary to the root `package.json` devDependencies.
- Adds `pnpm run lint:oxlint` to the root scripts. The call is `oxlint .`.
- Adds a CI step that runs `pnpm run lint:oxlint` after the ESLint job. The
  step is `continue-on-error: true`, never affects job status, and uploads
  `oxlint.out` as a 14-day artifact for diff over time.

What it does **not** do:

- It does not change ESLint behaviour. The four `no-restricted-syntax`
  selectors, `sonarjs/cognitive-complexity`, `react/forbid-elements`, and the
  SonarJS rules in `packages/eslint-config/base.js` are unchanged.
- It does not remove Prettier. `apps/*` `format` scripts still call
  `prettier --write`.
- It does not write to `turbo.json`. Phase 1 is a single-shot info job at the
  root; cache and per-workspace delegation arrive in Phase 2.

## Running locally

```
# Gate
pnpm run lint

# Informational, never blocks
pnpm run lint:oxlint

# Diff the oxlint output against the cached artifact
pnpm run lint:oxlint > oxlint.out 2>&1
tail -n 200 oxlint.out
```

## Expected Phase 1 output

Oxlint running with the four categories over ~428 `.ts`/`.tsx` files and
~455 `.ts`/`.tsx`/`.js`/`.mjs` files is expected to:

- Finish in under five seconds on a developer laptop. ESLint takes ~10-25x
  longer on the same input. The CI artifact captures actual numbers.
- Surface `correctness` errors that ESLint does not catch (the
  `suspicious` category's `no-unused-vars` is broadly aligned with
  typescript-eslint's, but the universe of correctness checks differs).
- Produce zero or near-zero findings on `apps/*/eslint.config.mjs` and
  the workspace `package.json` files. These are not `.ts`/`.tsx` and are
  excluded by `ignorePatterns`.
- Produce a non-zero exit code with findings that do not block the pipeline
  during Phase 1.

## Reading the artifact

The `oxlint-output` artifact attached to the CI run is a UTF-8 text file with
one finding per line in the form:

```
<file>:<line>:<column> [<rule-name>] <message>
```

A simple summary from the CI step:

```
errors:   <count>
warnings: <count>
```

Compare counts across runs to track the gap between ESLint and Oxlint on the
same commit.

## Windows note

The oxc project documents known OOM errors on Windows. If
`pnpm run lint:oxlint` exits with an out-of-memory error, the workaround is
to run oxlint inside WSL or to raise the Node heap size:

```
NODE_OPTIONS=--max-old-space-size=8192 pnpm run lint:oxlint
```

Local Mac and Linux runs are not affected.

## What changes in Phase 2

Phase 2 introduces `eslint-plugin-oxlint` to auto-disable ESLint rules that
Oxlint already covers. ESLint stays as the gate only for the four
`no-restricted-syntax` selectors in `packages/eslint-config/base.js`,
`sonarjs/cognitive-complexity`, `react/forbid-elements`, and any
`@next/eslint-plugin-next` rule that Oxlint does not yet cover. See ADR-031
for the full phase plan.
