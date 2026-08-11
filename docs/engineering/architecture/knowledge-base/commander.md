# Commander.js

A study of [commander.js](https://github.com/tj/commander.js),
the CLI framework. Built on
[tj.github.io/commander.js](https://tj.github.io/commander.js/)
— the upstream page is the source of truth when the lib
changes; this entry exists to show the shape of the
integration and the patterns a new command should follow.

## What commander gives us

Commander is a Command class with two responsibilities:

1. **Argument parsing** — flags (`--api-url <url>`), options
   (`--category <name>`), positional arguments
   (`teardown <dir> [otherDirs...]`).
2. **Subcommand dispatch** — `program.command('list')` returns
   a Command for that subcommand; chained `.option()` and
   `.action()` register the handler.

The runtime is `program.parseAsync(argv)` (or `.parse()` for
synchronous handlers). `parseAsync` is the right choice
when every handler is async (it touches the network).

## The two-call shape

Commander's `command()` has two distinct shapes depending
on whether a description is passed:

```ts
// With a description: registers a subcommand, returns the program.
program.command('list', 'List available templates');
// (returns `program`, so you can chain a parent `.option()`)

// Without a description: returns the new command for chaining.
program
  .command('list')
  .description('List available templates')
  .option('--category <name>', 'filter to a single category')
  .action(async (opts) => { /* ... */ });
// (returns the new `Command`, so `.action()` is attached)
```

The first form is used when the child command is loaded
from a separate file (the parent only knows the name).
The second form is used when the child command is defined
inline. The inline form is the right shape for a single-file
CLI where each command lives in its own module.

## The action handler

The `.action()` signature receives the parsed arguments
in declaration order, followed by the command itself:

```ts
program
  .command('list')
  .description('List available templates')
  .option('--category <name>', 'filter to a single category')
  .option('--json', 'JSON output for scripting')
  .action(
    async (opts: { category?: string; json?: boolean }, command: Command) => {
      // `opts` is the parsed options bag.
      // `command` is the subcommand; `command.parent` is the program.
    },
  );
```

The second argument is the standard way to read
parent-level options:

```ts
const apiUrl = command.parent?.getOptionValue('apiUrl') as
  | string
  | undefined;
```

The cast is necessary because `getOptionValue` returns
`unknown`. The pattern is the same across every command in
the CLI, which is the right shape for a program-wide
option.

## Async and `parseAsync`

Handlers are async. The error a handler throws is
propagated to the caller of `parseAsync`. The
top-level catch is the last-resort handler:

```ts
program.parseAsync(process.argv).catch((err) => {
  process.stderr.write(
    `${pc.red('Internal error')}: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
```

The last-resort catch handles two cases:

- **Uncaught bugs** — a handler that forgot to catch a
  domain error and re-threw a plain `Error`. The error is
  surfaced as "Internal error" with optional stack trace
  under a debug flag.
- **Library errors** — a network failure that bypassed
  every handler's `try`/`catch`. Same treatment.

Per-command handlers are responsible for catching domain
errors and exiting cleanly with the right code. Anything
that lands in the top-level catch is uncaught by design.

## Options vs arguments

**Options** are flags. The flag string uses comma, pipe,
or space as separators: `-p, --pepper`, `-p|--pepper`,
`-p --pepper`. The flag's name becomes the camelCase key
on the opts bag: `--api-url` becomes `opts.apiUrl`.

**Arguments** are positional. The declaration uses `<>`
for required, `[]` for optional, trailing `...` for
variadic. `teardown <dir> [otherDirs...]` declares one
required and one variadic optional argument.

When every command's inputs are flags, positional
arguments are not needed.

## Required options

`requiredOption` enforces a value at parse time:

```ts
program
  .command('init')
  .requiredOption('--template <slug>', 'template slug to install')
  .action(/* ... */);
```

The user gets a parse error before the handler runs. The
alternative is `.option()` plus a manual check in the
handler; we keep that for optional flags.

## Default values

`.option('--api-url <url>', 'description', defaultValue)`:

```ts
program.option(
  '--api-url <url>',
  'API base URL',
  process.env.DEESSEJS_API_URL ?? DEFAULT_API_URL,
);
```

The third argument is the default. The convention is to
surface the environment variable as the default — the CLI
reads the env once, at parse time, and never re-reads it.

## Boolean flags

`--json` is a boolean flag. Commander handles `--json` and
`--no-json` automatically; the value is `opts.json ===
true` or `opts.json === false` depending on which the user
passed.

For an explicit boolean with a default:

```ts
program.option('--json', 'JSON output for scripting', false);
```

The default of `false` means `--json` is opt-in. This
pattern is used for every boolean flag.

## What we don't use

- **No `exitOverride()`** — the CLI is a real CLI, not a
  library. `process.exit()` is the right behavior. If we
  ever need to test command-line invocation
  programmatically, we add `exitOverride()` then.
- **No variadic arguments** — every input is a flag.
- **No executable subcommands** — `program.command('list',
  'List available templates')` is not used; we always
  chain. The two-call form is for cases where the child
  lives in a separate file (we don't need that yet).
- **No custom help formatting** — commander's default help
  is fine. `--help` is wired automatically.

## What this entry is not

This is a knowledge-base entry, not an ADR. It documents
how commander.js works in the current version of the lib,
and the shape of the integration. The **decisions** (which
subcommand shape to use, how to surface parent options,
where the last-resort catch lives) live in
`docs/engineering/architecture/decisions/`. When a future
change conflicts with this entry, the entry is wrong, not
the code.
