# packages/typescript-config

You own the compiler settings that every workspace inherits. These options decide what the type checker accepts across the whole monorepo.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace: the API path, the auth base path, the wire contracts, the research protocol and the git workflow. Read it when your change touches one of them, not before every edit.

## The presets

| File | Extends | Used by |
|---|---|---|
| `base.json` | nothing | The packages, the CLI and the scaffolder. |
| `nextjs.json` | `base.json` | The Next.js applications. |
| `react-library.json` | `base.json` | The React library packages. |

## What the base preset enforces

| Option | Value | Why it matters here |
|---|---|---|
| `module`, `moduleResolution` | `NodeNext` | The packages are ESM. This is why every relative import carries the `.js` extension. |
| `strict` | on | The baseline. |
| `verbatimModuleSyntax` | on | A type-only import has to say `import type`, and a value import is never erased. |
| `exactOptionalPropertyTypes` | on | `{ a?: string }` and `{ a: string \| undefined }` are different types. |
| `noUncheckedIndexedAccess` | on | An indexed access is `T \| undefined`, so every array read is checked. |
| `isolatedModules` | on | Every file is a module, which is what the bundlers assume. |
| `noFallthroughCasesInSwitch` | on | A switch case cannot fall through by accident. |
| `useUnknownInCatchVariables` | on | A caught error is `unknown`, so it has to be narrowed before use. |
| `target`, `lib` | `ES2024` | The runtime floor. |

## What the Next.js preset changes

`module` becomes `ESNext`, `moduleResolution` becomes `Bundler`, `jsx` becomes `preserve`, `allowJs` is on and `noEmit` is on. The Next.js plugin is registered, and the Next.js type generation runs before the type check.

## Conventions

- **A workspace extends a preset, it does not repeat it.** `tsconfig.json` in a workspace extends `@workspace/typescript-config/base.json` and adds what is specific to it.
- **Do not loosen a compiler option to make an error go away.** The `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` errors are the point of the preset. Fix the code.
- **When an option has to be relaxed for one file,** scope it to that file and say why in a comment.

## Gotchas

- There is no build script. The presets are JSON files, consumed directly.
- The Next.js applications need `next typegen` before `tsc --noEmit`, because the route types are generated. `apps/docs` does it in its `typecheck` script; do the same when you add an application.

## Related guides

- [Root guide](../../AGENTS.md)
- [packages/eslint-config](../eslint-config/AGENTS.md)
