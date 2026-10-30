# @deessejs/cli

CLI for the DeesseJS template registry and block sources.

## Install

The package is published as `@deessejs/cli` and exposes the `deessejs` executable:

```bash
npx @deessejs/cli@latest <command>
```

Other release channels:

- `@canary`: on-demand pre-release of the current `staging` branch. Published by the `release.yml` workflow via `workflow_dispatch` with the `canary` input. Install with `npx @deessejs/cli@canary <command>`.
- Per-PR previews: every PR gets a SHA-keyed ephemeral preview via [pkg.pr.new](https://pkg.pr.new). The install URL is posted as a sticky comment on the PR by the `cli-preview.yml` workflow.

## Commands

| Command                              | Role                                                            |
| ------------------------------------ | --------------------------------------------------------------- |
| `deessejs init <slug-or-github-url>` | Create a project from a catalog template or a GitHub repository |
| `deessejs list`                      | List available templates                                        |
| `deessejs info <slug-or-github-url>` | Show validated descriptor details for a template                |
| `deessejs block info <source>`       | Show a validated block descriptor summary                       |
| `deessejs block check [source]`      | Validate a block descriptor and its referenced assets           |

## Examples

```bash
deessejs list
deessejs list --category saas --json
deessejs info saas-starter --json
deessejs info https://github.com/owner/repository --ref main
deessejs block info ./blocks/upstash-redis
deessejs block info https://github.com/deessejs/blocks/tree/main/upstash-redis --json
deessejs block check ./blocks/upstash-redis
deessejs block check https://github.com/deessejs/blocks/upstash-redis --json
deessejs init saas-starter
deessejs init saas-starter --ref develop --no-install
deessejs init https://github.com/owner/repository
deessejs init saas-starter --verbose
```

`init` accepts a catalog slug or an HTTPS URL to a GitHub repository root. Both forms use the repository's root `deesse-template.json` to select the files to create. The descriptor must be present and valid; there is no Git clone fallback. `--ref` selects a branch or other Git ref. `--force` allows an existing empty target directory; it never removes existing files.

If the selected files include a root `deesse.json`, `init` validates it against project config V1 and preserves its contents. If the template does not include one, `init` creates a default config with the project schema URL and `formatVersion: 1`.

`info` accepts a catalog slug or GitHub repository URL and shows the same descriptor fields for both. Slugs are mapped to repositories through a lightweight catalog lookup; `info` does not fetch the GitHub-enriched listing. It then reads only the root `deesse-template.json` through GitHub's Contents API, without downloading or inventorying the full repository. `--ref` inspects a specific branch or other Git ref. With `--json`, the result contains the validated `descriptor` and source repository.

`block info` accepts a local block directory, a public HTTPS GitHub repository URL, a shorthand GitHub directory URL such as `https://github.com/owner/repository/block`, or a canonical `/tree/<ref>/<block-path>` URL. It resolves a remote ref to a commit before reading the root `deesse-block.json` and the package manifests declared by its file mappings. It does not modify a project, install dependencies or execute package scripts. `--json` returns the descriptor, package summaries and source identity.

`block check` accepts the same local and GitHub sources and defaults to the current directory when no source is given. It validates the descriptor and reads every file declared in `install.files`, including package manifests. It reports all unreadable assets without writing to the project, installing dependencies or executing package scripts. It does not yet plan changes against a receiving project. Use `--json` for stable diagnostic codes and source paths.

By default, `init` hides package manager logs and shows a concise progress summary. Pass `--verbose` to print the resolved template source, ref, destination, commit, and selected file count, as well as the full package manager output when installation runs. Verbose details go to stderr so `--json` keeps stdout machine-readable. The details are also shown with `--no-install`.

## Global flags

- `--api-url <url>`: override the templates endpoint (default: `https://deessejs.com/api/templates`)
- `--json`: JSON output for scripting

## License

MIT.

## Related

- **Uses**: [`@workspace/api`](https://github.com/deessejs/deessejs/blob/staging/packages/api/README.md), [`@workspace/contracts`](https://github.com/deessejs/deessejs/blob/staging/packages/contracts/README.md)
- **Bundles**: the workspace dependencies into the published package at build time, so nothing is resolved at run time
