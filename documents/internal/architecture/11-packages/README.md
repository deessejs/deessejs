# `11-packages/` — Per-package documentation

## Purpose

One subdirectory per package in `apps/template/packages/` (or in the root `packages/` for cross-app shared code). Each subdirectory contains the **local** documentation for that package: its purpose, internal structure, conventions, testing strategy, and local ADRs.

System-wide concerns (data model, API surface, security, etc.) live in the corresponding `0X-` directories. **A package's docs cross-link to system concerns; the system concerns cross-link back to the relevant package.**

The goal: when someone works on `packages/api`, they find everything they need in `11-packages/api/` and follow the links out. When someone works on a system concern, they find the relevant packages from the concern's README.

## What's in here

One folder per package, named exactly after the package directory:

```
11-packages/
├── api/        # apps/template/packages/api
├── auth/
├── database/
├── logs/
├── sdk/
└── ...
```

Each package folder follows the same template — see [`api/README.md`](./api/README.md) for the canonical example.

## Conventions

- **One folder per package.** Do not create flat files at the root of `11-packages/`.
- **Mirror the repo package name.** `11-packages/api/` documents `apps/template/packages/api/`. Folder name in the docs matches the directory name in the repo.
- **No duplication with system concerns.** If a topic lives in `02-data-model/`, link to it from the package's `README.md` — do not rewrite it.
- **Local ADRs stay local.** Decisions scoped to a single package live in `11-packages/<pkg>/decisions/`. If a local decision becomes structural (impacts ≥ 2 packages or apps), promote it to `10-decisions/` and add a `Superseded` note in the local folder.
- **Cross-linking is mandatory.** Every package README must list its system concerns and its local ADRs. Every system concern that mentions a package must link to the package's folder.

## Package template

Each `11-packages/<name>/` folder contains:

| File | Required | Purpose |
|---|---|---|
| `README.md` | yes | Purpose, surface, internal structure, conventions, cross-references |
| `structure.md` | required for packages with more than one subfolder | Detailed layout, file-by-file responsibilities |
| `<topic>.md` | as needed | Package-specific topics (e.g. `errors.md`, `registry.md`, `testing.md`) |
| `decisions/` | optional | Local ADRs, numbered `NNNN-<slug>.md` |

The `README.md` follows this structure (mirror of `01-stack/<tech>.md`):

1. **Purpose** — what the package does, in one sentence
2. **Surface** — what it exports (public API of the package itself)
3. **Internal structure** — top-level layout, one line per subfolder
4. **Conventions** — how to add code, what is forbidden, the modular contract this package honors
5. **Testing** — package-specific test strategy
6. **Cross-references** — system concerns, system ADRs, local ADRs

## Related

- [`../01-stack/`](../01-stack/) — per-technology rationale (the "why we picked it" layer)
- [`../02-data-model/`](../02-data-model/) — data model across the system
- [`../04-api-surface/`](../04-api-surface/) — public API surface
- [`../08-testing/`](../08-testing/) — system-wide test strategy
- [`../10-decisions/`](../10-decisions/) — system-wide ADRs
- [`../12-apps/`](../12-apps/) — per-app documentation
