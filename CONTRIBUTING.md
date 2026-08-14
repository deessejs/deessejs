# Contributing

Thank you for your interest in contributing!

## Development Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Create a `.env` file at the repo root based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in `DATABASE_URL` and `BETTER_AUTH_SECRET` (generate one with
   `openssl rand -base64 32`). One `.env` is read by every app, package,
   script, and test in the monorepo — no per-app copies required.

## Workflow

### Branch Naming

- `feat/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation updates
- `refactor/` — Code refactoring

### Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `chore:` — Maintenance tasks

### Changesets (required for `@deessejs/cli` PRs)

If your PR touches `apps/cli/**` and changes the CLI's published surface, you must include a [changeset](https://github.com/changesets/changesets). Changesets are short Markdown files under `.changeset/` that describe the change and its bump type (`patch`, `minor`, `major`).

**When to add one:**

- ✅ New command, new flag, user-visible behavior change, bug fix.
- ❌ Internal package changes, other apps, test-only changes, docs-only, catalog dependency bumps without API changes.
- ❌ **Adding, updating, or removing a template entry** in `packages/api/src/templates.ts` (templates are content served by the API; the CLI is just a client). See [docs/engineering/reports/versioning/11-templates-not-cli.md](docs/engineering/reports/versioning/11-templates-not-cli.md) for the full reasoning and the edge cases where a template-related change IS a CLI change.

**Quick start:**

```bash
pnpm changeset    # interactive — picks package, bump type, writes the file
```

Or create `.changeset/<random-slug>.md` manually:

```markdown
---
"@deessejs/cli": minor
---

Add `deessejs list --category <name>` flag for filtering templates by category
```

CI verifies the changeset is present on PRs that touch `apps/cli/**`. For full format details, examples, and the lifecycle of a changeset, see [.changeset/README.md](.changeset/README.md). For the broader release process, see [docs/engineering/processes/versioning.md](docs/engineering/processes/versioning.md).

### Pull Requests

1. Fork the repository
2. Create a feature branch off `staging` (not `main` — see AGENTS.md)
3. Make your changes
4. Add a changeset if your PR touches `apps/cli/**` (see above)
5. Run `pnpm lint` and `pnpm typecheck`
6. Submit a pull request against `staging`

## Scripts

```bash
pnpm build     # Build all packages
pnpm dev       # Start development servers
pnpm lint      # Lint all packages
pnpm typecheck # Type check all packages
pnpm format    # Format code
```

## Packages

### Adding a New Package

1. Create the package in `packages/` or `apps/`
2. Add it to `pnpm-workspace.yaml`
3. Use `workspace:*` for internal dependencies
4. Use `catalog:` for shared dependencies

### Shared Dependencies

Update shared dependencies in `pnpm-workspace.yaml` under `catalog:`.

## Module Resolution

The repo mixes two bundler/resolver stacks and they disagree on one
detail: **whether to write `.js` extensions on relative imports.**

- **`packages/*`** (Node ESM, `tsc` output): keep the `.js` extension
  in source. This is the `verbatimModuleSyntax` convention required by
  the shared tsconfig — the emitted JS really is `.js`, and Node's
  ESM resolver needs the explicit extension to find it.
  ```ts
  import { appRouter } from "./router/index.js"
  ```
- **`apps/web`** (Next.js 16 with Turbopack): **drop** the `.js`
  extension. Turbopack does not honor the `verbatimModuleSyntax`
  convention and treats `./foo.js` as a literal path, which fails to
  resolve to `./foo.ts`.
  ```ts
  import { orpc } from "@/lib/orpc"
  // relative: import { x } from "./y"      ← no .js
  ```

Mixing the two conventions in the same package will fail the build.
When in doubt, check what the surrounding files do.

## Shared Error Envelope (API)

The Hono app in `packages/api` returns a stable JSON envelope for
every error path (`onError`, `notFound`, rate-limit 429). The shape
is `{ code, message, requestId }`. The helper that builds it lives
in `packages/api/src/envelope.ts` and is the single source of truth:

```ts
import { errorBody, readRequestId } from "@workspace/api/envelope"
return c.json(errorBody(c, "not_found", "Route not found"), 404)
```

Adding a new top-level field to the envelope is a breaking change for
all consumers (CLI, apps/web). Keep the shape small and stable.

## Support

For questions, open an issue or contact [support@deessejs.com](mailto:support@deessejs.com)
