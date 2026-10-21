# apps/docs

You own the documentation site: the reference that tells a user how to install the CLI, how to authenticate a machine, and what the template registry serves. The readers are developers, so every page has to be runnable as written.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace: the API path, the auth base path, the wire contracts, the research protocol and the git workflow. Read it when your change touches one of them, not before every edit.

## Key files

| Path | Owns |
|---|---|
| `content/docs/` | The MDX documentation: index, what is DeesseJS, the CLI pages, the comparisons. |
| `content/meta.json` | The sidebar order. |
| `source.config.ts` | The Fumadocs configuration: where the content lives, how it is parsed. |
| `src/app/docs/[[...slug]]/` | The documentation renderer. |
| `src/app/api/search/` | The search endpoint. |
| `src/app/llms.txt/`, `llms.mdx/`, `llms-full.txt/` | The machine-readable exports for language models. |
| `src/app/og/` | The Open Graph images. |
| `src/lib/` | The helpers shared by the pages. |

## Conventions

- **One MDX file per page, in `content/docs/`.** The filename becomes the URL segment, and `content/meta.json` decides the order in the sidebar. Keep the two in sync.
- **The MDX is compiled before the type check.** `pnpm typecheck` runs `fumadocs-mdx` and `next typegen` first, then `tsc --noEmit`. A type error in a doc is usually a stale generated type.
- **Commands in the documentation are real commands.** Copy them from the CLI source, do not write them from memory. The CLI reference must match what `deessejs --help` actually prints.
- **The site consumes `@workspace/ui` through a `paths` alias,** so the primitives are compiled from source rather than from a build artifact.
- **The PostCSS config is re-exported from `@workspace/ui/postcss.config`,** on purpose, to stay in sync with the other applications. Do not fork it here.

## Commands

```bash
pnpm dev                    # next dev, port 3000
pnpm build
pnpm typecheck              # fumadocs-mdx && next typegen && tsc --noEmit
pnpm lint
pnpm format
```

## Gotchas

- There is no test suite in this workspace. The page-level behaviour is covered by the e2e suites of the other applications.
- The port is shared with the other Next applications. When 3000 is busy, Next.js takes the next free port, and the inter-app URLs follow the `NEXT_PUBLIC_*` variables rather than the port you see in the terminal.

## Related guides

- [Root guide](../../AGENTS.md)
- [apps/cli](../cli/AGENTS.md)
- [packages/ui](../../packages/ui/AGENTS.md)
