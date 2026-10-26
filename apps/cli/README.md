# @deessejs/cli

CLI for the DeesseJS template registry.

## Install

The package is published as `@deessejs/cli` and exposes the `deessejs` executable:

```bash
npx @deessejs/cli@latest <command>
```

Other release channels:

- `@canary`: on-demand pre-release of the current `staging` branch. Published by the `release.yml` workflow via `workflow_dispatch` with the `canary` input. Install with `npx @deessejs/cli@canary <command>`.
- Per-PR previews: every PR gets a SHA-keyed ephemeral preview via [pkg.pr.new](https://pkg.pr.new). The install URL is posted as a sticky comment on the PR by the `cli-preview.yml` workflow.

## Commands

| Command                | Role                                                      |
| ---------------------- | --------------------------------------------------------- |
| `deessejs init <slug-or-github-url>` | Create a project from a catalog template or a GitHub repository |
| `deessejs list`        | List available templates                                  |
| `deessejs info <slug>` | Show details for one template                             |

## Examples

```bash
deessejs list
deessejs list --category saas --json
deessejs info saas-starter --json
deessejs init saas-starter
deessejs init saas-starter --ref develop --no-install
deessejs init https://github.com/owner/repository
```

`init` accepts a catalog slug or an HTTPS URL to a GitHub repository root. A direct GitHub repository must contain a valid `deesse-template.json`; otherwise initialization reports that the repository is not supported. Catalog templates with no descriptor retain the Git clone fallback. A present invalid descriptor stops initialization with a diagnostic. `--ref` selects a branch or other Git ref. `--force` allows an existing empty target directory; it never removes existing files.

## Global flags

- `--api-url <url>`: override the templates endpoint (default: `https://deessejs.com/api/templates`)
- `--json`: JSON output for scripting

## License

MIT.

## Related

- **Uses**: [`@workspace/api`](https://github.com/deessejs/deessejs/blob/staging/packages/api/README.md), [`@workspace/contracts`](https://github.com/deessejs/deessejs/blob/staging/packages/contracts/README.md)
- **Bundles**: the workspace dependencies into the published package at build time, so nothing is resolved at run time
