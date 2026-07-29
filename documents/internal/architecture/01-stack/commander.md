# Commander.js

## Decision

**Commander.js** (`commander` on npm) for argument parsing and command structure in `apps/template/apps/cli/`.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## What it does

Commander is the de-facto Node/Bun CLI framework. It provides:

- Command and subcommand structure (`program.command('deploy').action(...)`).
- Argument and option parsing with types and defaults.
- Auto-generated help text (`--help`).
- Auto-generated version flag (`--version`).
- Hooks (`hook('preAction')` for setup, `hook('postAction')` for cleanup).
- Exit code handling.

For our CLI, Commander is the orchestration layer. It calls into our SDK for API operations, into our config layer for reading the user's local state, and into a small formatting layer (chalk for colors, ora for spinners) for terminal output.

## Why Commander

- **Mature and ubiquitous.** Used by every major CLI in the Node ecosystem (npm, yarn, pnpm, vercel, gh, etc.). Battle-tested.
- **TypeScript-native.** The types are first-class, no `@types/commander` needed.
- **Bun-compatible.** Works without changes under Bun runtime and `bun build --compile`.
- **Minimal API surface.** Easy to learn, easy to teach, easy to extend.
- **Plugin-friendly.** The buyer can extend their CLI by registering additional commands with Commander directly (feature 9.9).

## Alternatives considered

| Alternative | Why not |
|---|---|
| **yargs** | Older API, less TypeScript-native, larger surface area. |
| **oclif** | Powerful (plugin system, hooks, auto-docs) but heavy. Brings its own runtime conventions, conflicts with our pattern of "just Commander." Best for very large CLI tools (Salesforce-scale). |
| **citty** | Modern, by the unjs team, TypeScript-first. Smaller ecosystem than Commander. Considered for greenfield projects; rejected because Commander's ubiquity means more contributors know it. |
| **cac** | Tiny (6kb), TypeScript-first, declarative. Could work but smaller community. |
| **clipanion** | Yarn's CLI framework. Tied to Yarn's patterns. Not portable. |
| **DIY with `process.argv`** | Loses help generation, type safety, and conventions. Not worth the saved bytes. |

## Usage pattern

In `apps/template/apps/cli/src/index.ts`:

```ts
import { Command } from 'commander';
import { deployCommand } from './commands/deploy';
import { loginCommand } from './commands/login';
import { logsCommand } from './commands/logs';

const program = new Command();

program
  .name('deessejs')
  .description('The DeesseJS CLI — manage your DeesseJS app')
  .version('0.0.1');

program.addCommand(loginCommand);
program.addCommand(deployCommand);
program.addCommand(logsCommand);

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Each command is its own file in `apps/template/apps/cli/src/commands/`:

```ts
// commands/deploy.ts
import { Command } from 'commander';
import { deploy } from '@deessejs/sdk';

export const deployCommand = new Command('deploy')
  .description('Deploy your app to production')
  .option('-e, --env <env>', 'Target environment', 'production')
  .option('--dry-run', 'Show what would happen without doing it')
  .action(async (opts) => {
    await deploy({ env: opts.env, dryRun: opts.dryRun });
  });
```

## Plugin system (feature 9.9)

Commander's command registration is the plugin mechanism. A buyer who wants to add a custom command:

```ts
// In their customized CLI
import { program } from '@deessejs/cli/core';
import { myCustomCommand } from './my-custom-command';

program.addCommand(myCustomCommand);
```

No framework-specific plugin API needed. The buyer can also **remove** commands they don't want by not calling `addCommand` for them — or by deleting the corresponding file from `src/commands/`.

## Constraints

- Commander is the **only** CLI framework dependency. Don't add yargs, oclif, or similar as a side dependency.
- Custom command files must extend Commander's `Command` class. No ad-hoc argument parsing.
- The CLI's `bin` entry in `package.json` points to the compiled binary, not a `.ts` file. End users never run Bun.

## Cross-references

- [`../10-decisions/0002-cli-runtime-and-distribution.md`](../10-decisions/0002-cli-runtime-and-distribution.md) — the runtime + distribution decision (Bun, single-file binary).
- [`../../product/features/09-cli.md`](../../product/features/09-cli.md) — the CLI feature inventory.
- [`bun.md`](./bun.md) — the Bun runtime rationale.