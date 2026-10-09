# Package Starter

TypeScript monorepo template with pnpm workspaces and Turborepo.

## Stack

- **Package manager:** pnpm 9 with workspace protocol
- **Build orchestrator:** Turborepo 2.x
- **Language:** TypeScript 5
- **Testing:** Vitest workspace

## Getting started

```bash
deessejs init package-starter
cd package-starter
pnpm install
pnpm build
```

## Layout

```
packages/
  core/            # shared library
  utils/           # framework-agnostic helpers
  types/           # type-only package
examples/
  basic/           # minimal consumer
```

## Tooling

- ESLint flat config preset shared via `@workspace/eslint-config`
- Prettier with the `@trivago/prettier-plugin-sort-imports` preset
- Changesets for versioning and publishing
- GitHub Actions for CI: lint, typecheck, test, build
