# packages/eslint-config

You own the lint rules that every workspace inherits. A rule you change here changes the codebase, so the blast radius is the whole monorepo.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace: the API path, the auth base path, the wire contracts, the research protocol and the git workflow. Read it when your change touches one of them, not before every edit.

## The exports

| Export | File | Used by |
|---|---|---|
| `.` and `./base` | `base.js` | The packages, the applications, the CLI and the scaffolder. |
| `./next` | `next.js` | The Next.js applications. |
| `./react-internal` | `react-internal.js` | The React library packages. |

`base.js` composes the ESLint recommended rules, the TypeScript recommended rules and the SonarJS recommended rules, and it ignores `dist/`, `.next/`, `.turbo/` and `coverage/`.

## The cognitive complexity rule

SonarJS measures the cognitive complexity, which is closer to a human reading cost than the raw cyclomatic complexity: nested branches weigh more than sibling branches, and the `||` and `?.` chains are counted.

The threshold is **warn at 30**, deliberately high so that the existing codebase stays green on adoption. The plan is to pay the debt down with the weekly complexity report, then tighten to 15, and eventually to 10 with an error at 20.

When you raise a function's complexity, the fix is usually to extract a named step rather than to raise the threshold.

## Conventions

- **The rules are shared, not duplicated.** A workspace that needs a specific rule adds it in its own `eslint.config.mjs`, on top of this base.
- **Every workspace lints with zero warnings.** The lint task runs with `--max-warnings=0`, so a warning fails the build.
- **Comments explain the intent, not the mechanics.** A rule that needs a justification carries a comment saying why the threshold is what it is.

## Gotchas

- The package has no build script. It is consumed as source, through the exports map.
- The config files are flat configs. A rule that needs a legacy format does not belong here.

## Related guides

- [Root guide](../../AGENTS.md)
- [packages/typescript-config](../typescript-config/AGENTS.md)
