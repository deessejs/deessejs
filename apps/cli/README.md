# @deessejs/cli

CLI for the DeesseJS template registry and block sources.

Requires Node.js 22.14 or later.

## Install

The package is published as `@deessejs/cli` and exposes the `deessejs` executable:

```bash
npx @deessejs/cli@latest <command>
```

Other release channels:

- `@canary`: on-demand pre-release of the current `staging` branch. Published by the `release.yml` workflow via `workflow_dispatch` with the `canary` input. Install with `npx @deessejs/cli@canary <command>`.
- Per-PR previews: every PR gets a SHA-keyed ephemeral preview via [pkg.pr.new](https://pkg.pr.new). The install URL is posted as a sticky comment on the PR by the `cli-preview.yml` workflow.

## Commands

| Command                                | Role                                                            |
| -------------------------------------- | --------------------------------------------------------------- |
| `deessejs init <slug-or-github-url>`   | Create a project from a catalog template or a GitHub repository |
| `deessejs list`                        | List available templates                                        |
| `deessejs info <slug-or-github-url>`   | Show validated descriptor details for a template                |
| `deessejs block info <source>`         | Show a validated block descriptor summary                       |
| `deessejs block check [source]`        | Validate a block descriptor and its referenced assets           |
| `deessejs add <source> --target <id>`   | Preview and add a published, GitHub, or local block               |
| `deessejs organization list`           | List organizations the signed-in user belongs to                |
| `deessejs organization info <slug>`    | Show one of the signed-in user's organizations                  |
| `deessejs organization create <name>`  | Create an organization                                          |
| `deessejs update` / `deessejs upgrade` | Check for and install a CLI update                              |

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
deessejs add upstash-redis --target web --dry-run
deessejs add ./blocks/upstash-redis --target web
deessejs add https://github.com/acme/blocks/tree/main/cache --target web --ref main
deessejs init saas-starter
deessejs init saas-starter --ref develop --no-install
deessejs init https://github.com/owner/repository
deessejs init saas-starter --verbose
deessejs auth login
deessejs organization list
deessejs organization info acme
deessejs organization create "Acme Studio"
deessejs organization list --json
deessejs organization template list acme --json
deessejs organization template info acme starter-kit
deessejs organization template add acme --slug starter-kit --name "Starter Kit" --repository https://github.com/acme/starter-kit --category saas
```

`init` accepts a catalog slug or an HTTPS URL to a GitHub repository root. Both forms use the repository's root `deesse-template.json` to select the files to create. The descriptor must be present and valid; there is no Git clone fallback. `--ref` selects a branch or other Git ref. `--force` allows an existing empty target directory; it never removes existing files.

If the selected files include a root `deesse.json`, `init` validates it against project config V1 and preserves its contents. If the template does not include one, `init` creates a default config with the project schema URL and `formatVersion: 1`.

`info` accepts a catalog slug or GitHub repository URL and shows the same descriptor fields for both. Slugs are mapped to repositories through a lightweight catalog lookup; `info` does not fetch the GitHub-enriched listing. It then reads only the root `deesse-template.json` through GitHub's Contents API, without downloading or inventorying the full repository. `--ref` inspects a specific branch or other Git ref. With `--json`, the result contains the validated `descriptor` and source repository.

`block info` accepts a local block directory, a public HTTPS GitHub repository URL, a shorthand GitHub directory URL such as `https://github.com/owner/repository/block`, or a canonical `/tree/<ref>/<block-path>` URL. It resolves a remote ref to a commit before reading the root `deesse-block.json` and the package manifests declared by its file mappings. It does not modify a project, install dependencies or execute package scripts. `--json` returns the descriptor, package summaries and source identity.

`block check` accepts the same local and GitHub sources and defaults to the current directory when no source is given. It validates the descriptor and reads every file declared in `install.files`, including package manifests. It reports all unreadable assets without writing to the project, installing dependencies or executing package scripts. It does not yet plan changes against a receiving project. Use `--json` for stable diagnostic codes and source paths.

Organization commands require an active session from `deessejs auth login`. `list` and `info` use Better Auth's authenticated organization endpoints and only show organizations the caller belongs to. `create` proposes a slug from the name, then sends the name and slug through DeesseJS's authenticated provisioning API. The server validates the slug, resolves collisions and returns the stored slug. Creating an organization does not change the active organization. Each command accepts `--json` for scripting.

`organization template list <organization-slug>` lists all templates owned by that organization that the signed-in user can access, including templates that have not been submitted for publication. `info <organization-slug> <template-slug>` shows one owned template. Both expose review and publication state independently from organization ownership. `add <organization-slug>` requires `--slug`, `--name`, `--repository` and `--category`; optional metadata uses `--description`, repeatable `--label` (repeat the option for each label) and `--license`. The API validates the public GitHub repository and requires an organization owner or admin. Adding a template creates an organization-owned entry; it does not publish it. Use `--json` for scripting.

`deessejs update` and its `upgrade` alias check the npm `latest` dist-tag, which is the stable release channel. A recognized global npm or pnpm installation is updated through its owning package manager. A local dependency or an installation whose location cannot be identified is left unchanged; the command prints a manual global install command instead. For ephemeral launches, rerun the launcher to use the new version:

```bash
npx @deessejs/cli@latest update
pnpm dlx @deessejs/cli@latest update
```

The command emits one JSON result by default. Pass `--verbose` for human-readable output. Registry/network failures produce a structured JSON error and nonzero exit status (or a readable error in verbose mode). Package-manager failures produce `status: "update-failed"`, include a recovery command, and return nonzero; child-process diagnostics are written to stderr so they do not corrupt JSON stdout.

By default, `init` hides package manager logs and shows a concise progress summary. Pass `--verbose` to print the resolved template source, ref, destination, commit, and selected file count, as well as the full package manager output when installation runs. Verbose details go to stderr so `--json` keeps stdout machine-readable. The details are also shown with `--no-install`.

## Global flags

`add` accepts an official published block slug (for example `upstash-redis`), a supported HTTPS GitHub repository/directory URL, or a local block directory. Remote Git refs resolve to immutable commits. Every invocation requires `--target <id>` from `deesse.json` `packageTargets`; the configured root must contain an existing package manifest. The command previews planned files, dependencies, `.env.example` declarations, and installation state, then asks for confirmation. Non-interactive use must pass `--dry-run`; applying without an interactive confirmation is unsupported. `--install` runs the detected package manager after application. Existing files and compatible dependency declarations are preserved; incompatible dependency ranges block the plan. Re-adding the same source revision to the same target is a no-op. A newer revision requires a future explicit update command.

For `upstash-redis`, the selected consumer target (for example `web` at `apps/web`) is distinct from the block output package at `packages/cache`. The planner checks declared workspace packages and pnpm catalog entries before writes, links the output package to the selected consumer, and adds missing `UPSTASH_REDIS_REST_URL=` and `UPSTASH_REDIS_REST_TOKEN=` declarations to `.env.example`. Configure real credentials yourself. The CLI never reads or modifies `.env`, stores secret values, or provisions an Upstash account.

- `--api-url <url>`: override the templates endpoint (default: `https://deessejs.com/api/templates`)
- `--json`: JSON output for scripting

## License

MIT.

## Related

- **Uses**: [`@workspace/api`](https://github.com/deessejs/deessejs/blob/staging/packages/api/README.md), [`@workspace/contracts`](https://github.com/deessejs/deessejs/blob/staging/packages/contracts/README.md)
- **Bundles**: the workspace dependencies into the published package at build time, so nothing is resolved at run time
