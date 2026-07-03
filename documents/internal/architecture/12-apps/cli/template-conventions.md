# Template conventions

Every DeesseJS template is a regular GitHub repo. There is no special build step, no required folder structure beyond what `manifest.json` declares, and no coupling to a specific framework version. This doc is the **protocol** a template author must follow to be consumable by `deesse init`.

## Required file: `manifest.json`

A template repo MUST have a `manifest.json` at its root. The CLI validates the file before extracting the tarball — invalid manifests are rejected with a specific error.

### Schema

```ts
interface Manifest {
  // The template's short name, used in `deesse init --template <name>` and
  // in the registry catalog. Lowercase, kebab-case, max 32 chars.
  name: string

  // Human-readable description (1-2 sentences). Shown in the registry picker
  // and in CLI error messages.
  description: string

  // Semver range for the CLI version that can consume this template.
  // The CLI rejects templates whose `deesse` range doesn't include the
  // current CLI version. Use "^0.1.0" while the CLI is in 0.x.
  deesse: string

  // Semver of the template itself. Bumped on every breaking change to the
  // template's file layout or token names.
  version: string

  // Optional. Object describing the runtime the template targets.
  requires?: {
    node?: string       // semver range, e.g. ">=22.12.0"
    pnpm?: string       // semver range, e.g. ">=9.0.0"
  }

  // Tokens the CLI will replace across the template's text files.
  // Listed by name. The CLI knows how to fill in the standard ones
  // (projectName, port, orgSlug). Custom tokens get prompted for.
  // Default if omitted: ["projectName"]
  tokens?: string[]

  // Files or directories to remove during post-process. Paths are
  // relative to the template root. No globs.
  // Default if omitted: ["CHANGELOG.md", "CONTRIBUTING.md", ".codesandbox"]
  remove?: string[]

  // Optional. Defaults to "deessejs". Used in the `deessejs/template-*` URL
  // shorthand and in the first git commit message.
  org?: string

  // Optional. Defaults to "main". The branch giget fetches by default.
  // Templates can pin to a stable branch (e.g. "v0") for prod use.
  branch?: string

  // Optional. A live demo URL hosted by the DeesseJS team. The gallery
  // renders a `<DemoButton>` for this URL on the template page.
  // Either a string (just the URL, simplest case at MVP) or a
  // DemoDescriptor object (filled by the auto-deploy CI in M0.2+).
  // If omitted, the template page shows no demo CTA.
  // Consumed by the gallery web app via the registry — the CLI itself
  // does not act on this field, but validates the schema when present.
  demo?: string | DemoDescriptor
}

interface DemoDescriptor {
  // Required. Fully-qualified URL to the live demo, hosted by DeesseJS.
  url: string
  // Optional. Branch the demo was deployed from.
  branch?: string
  // Optional. ISO 8601 timestamp of the last deployment, used to surface
  // staleness in the gallery UI (>90 days old = badge).
  lastDeployed?: string
  // Optional. Hosting provider — affects the badge label and the
  // pre-deployment expectations (Vercel templates live on the vercel.app
  // wildcard; CodeSandbox ones on codesandbox.io).
  provider?: 'vercel' | 'codesandbox' | 'other'
}
```

### Example

```json
{
  "name": "starter",
  "description": "Auth + DB + mail — the recommended starting point for a DeesseJS project.",
  "deesse": "^0.1.0",
  "version": "0.3.0",
  "requires": {
    "node": ">=22.12.0",
    "pnpm": ">=9.0.0"
  },
  "tokens": ["projectName", "port", "orgSlug"],
  "remove": ["CHANGELOG.md", ".codesandbox"],
  "org": "deessejs",
  "branch": "main",
  "demo": {
    "url": "https://starter.demo.deessejs.com",
    "branch": "main",
    "lastDeployed": "2026-07-01T12:00:00Z",
    "provider": "vercel"
  }
}
```

### Validation

The CLI rejects the manifest if:

- Any required field is missing
- `name` doesn't match `/^[a-z][a-z0-9-]{0,31}$/`
- `deesse` is not a valid semver range
- `version` is not a valid semver
- `requires.node` or `requires.pnpm` is not a valid semver range
- A token in `tokens` contains characters outside `[a-zA-Z][a-zA-Z0-9_]*`
- `demo` is an object whose `url` is missing or not a valid `https://` URL
- `demo.url` returns a non-2xx response when the CLI validates it (best-effort, can be skipped via `--skip-demo-check` for offline authoring)

Validation errors are specific. Example:

```
Invalid manifest for template "starter":
  - "requires.node" must be a valid semver range (got ">=22")
  - "tokens[2]" must match /^[a-zA-Z][a-zA-Z0-9_]*$/ (got "org-slug")
```

## Token replacement

The CLI replaces `{{tokenName}}` occurrences in **all text files** under the template root. Binary files (detected by NUL bytes in the first 8 KB) are skipped. `.git/` is skipped. `node_modules/` is skipped.

### Built-in tokens

The CLI fills these automatically without prompting:

| Token | Value | Source |
|---|---|---|
| `{{projectName}}` | The directory name (after validation) | Arg `dir` |
| `{{port}}` | `3000` (default), or `--port` if passed | Arg `--port` |
| `{{orgSlug}}` | `acme` (default), or `--org` if passed | Arg `--org` |
| `{{date}}` | ISO date of the scaffold | `new Date().toISOString().slice(0, 10)` |

### Custom tokens

Any token in `manifest.tokens` that is not built-in is prompted for interactively. If the env is not a TTY and the token is not built-in, the CLI errors:

```
Template "starter" requires the token "stripeKey", but no value was provided.
Pass --stripe-key=<value> or run in a TTY to be prompted.
```

The CLI flag form is `--stripe-key=<value>` (camelCase) for the token `stripeKey`.

### Boundaries

- The CLI replaces **only** tokens listed in `manifest.tokens`. Other `{{...}}` occurrences are left as-is.
- Replacement is a single-pass string replace. No recursive expansion (a token value that itself contains `{{...}}` is not re-replaced).
- No regex, no AST transform, no template engine. This is a deliberate constraint — anything more complex is the template's job (v0.2: template-side `transform.ts`).

## File removal

The CLI deletes the paths in `manifest.remove` after extraction. Paths are:

- Relative to the template root
- Exact paths (no globs, no `*` matches, no `**`)
- Either files or directories (recursive delete)

Common entries:

- `CHANGELOG.md` — the template's release notes, irrelevant to the user
- `CONTRIBUTING.md` — the template's contributor guide, irrelevant to the user
- `.codesandbox` — CodeSandbox config (only relevant for online editors)
- `.github` — the template's CI workflows (the user has their own)

## The `AGENTS.md` generation

The CLI **always** overwrites the template's `AGENTS.md` (if present) with a fixed string. Template authors cannot customize this file — the goal is that every DeesseJS project has the same `AGENTS.md` baseline so AI agents (Claude Code, Cursor, etc.) have a consistent starting point regardless of which template was used.

The generated file contains:

```md
## Development

When starting the dev server, use background mode:
pnpm dev --background

Manage the background server with `pnpm dev stop`, `pnpm dev status`, and `pnpm dev logs`.

## Documentation

Full documentation: https://docs.deessejs.com

Consult these guides before working on related tasks:
- [Adding pages, dynamic routes, or middleware](https://docs.deessejs.com/guides/routing)
- [Working with DeesseJS packages](https://docs.deessejs.com/guides/packages)
- ...
```

The exact content lives in `src/post-process/agents-md.ts` in the CLI repo. It is the canonical reference; the deessejs/docs repo mirrors it. (Per `head-of-design` session-model: the AGENTS.md content is the tech lead's responsibility, not a per-template decision.)

If the template doesn't ship an `AGENTS.md`, the CLI creates one. If it does, the CLI replaces it.

The CLI also symlinks `AGENTS.md` to `CLAUDE.md` (so Claude Code finds it without a separate file). The symlink falls back to a hard link, then to a copy, if the filesystem doesn't support symlinks.

## Template repo layout (example)

A complete template repo:

```
deessejs/template-starter/
├── manifest.json                   # required — the contract with the CLI
├── package.json                    # standard npm manifest
├── pnpm-workspace.yaml             # if the template is a workspace
├── README.md                       # the template's own README (CLI keeps it)
├── LICENSE
├── apps/
│   └── web/                        # the Next.js app
├── packages/
│   ├── auth/                       # the auth package
│   └── ...
├── .gitignore
└── (no AGENTS.md — the CLI generates it)
```

Note: the template does **not** need an `AGENTS.md` (the CLI writes one). It does need a `manifest.json` (the CLI validates it).

## What the template can and cannot do

**Can do:**

- Be any repo on GitHub, GitLab, Bitbucket, Sourcehut, or any custom tarball URL
- Use any language or framework (the CLI is template-agnostic)
- Use any internal folder structure (the CLI only cares about the root `manifest.json`)
- Use any package manager (the CLI detects from `npm_config_user_agent`)
- Ship its own `README.md`, `LICENSE`, `.gitignore`
- Use subdirectories of a larger repo (e.g. `gh:deessejs/templates/starter` extracts only `templates/starter/`)

**Cannot do:**

- Reference the CLI's source code (no `workspace:*` between a template and the CLI)
- Customize `AGENTS.md` content
- Run custom hooks at install time (v0.2 will add `transform.ts` for this)
- Require runtime dependencies that aren't declared in `manifest.requires`
- Bypass the manifest validation (the CLI is strict)

## Versioning

Templates are versioned semver. A breaking change to the file layout, token names, or required CLI version is a major bump. A new optional token or new `remove` entry is a minor bump. A fix to the template's own code is a patch.

The CLI does not check template versions on its own — `giget` fetches the default branch (or `manifest.branch` if set). For users who want to pin to a specific version, they pass it via the URL:

```bash
deesse init my-app --template gh:deessejs/template-starter#v0.3.0
```

The CLI prints the resolved version in the outro:

```
Done. Scaffolded from deessejs/template-starter@v0.3.0.
```

This is debug-friendly and gives the user a paper trail.
