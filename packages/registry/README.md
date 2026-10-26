# `@workspace/registry`

Shared descriptor validation and template planning for DeesseJS consumers.
The package resolves a source snapshot, validates the root
`deesse-template.json`, selects files, and returns their bytes in a stable
installation plan. It does not write to the destination or run commands.

## Build a plan from GitHub

```ts
import {
  createGitHubTemplateSourceAdapter,
  createTemplateInstallationPlan,
} from "@workspace/registry/v1"

const result = await createTemplateInstallationPlan(
  { repository: "deessejs/saas-template", ref: "main" },
  createGitHubTemplateSourceAdapter(),
)

if (!result.success) {
  for (const diagnostic of result.diagnostics) {
    console.error(diagnostic.code, diagnostic.path, diagnostic.message)
  }
} else {
  console.log(result.plan.source.revision)
  console.log(result.plan.files.map(({ path }) => path))
}
```

The selected source is resolved to a commit before the descriptor, file
inventory, and file bytes are read. The descriptor's optional `source` fields
are checked against that selected source; they cannot redirect it. GitHub's
recursive tree endpoint is rejected when it reports a truncated inventory.

## V1 selection behavior

- Picomatch applies `includes` first and `excludes` last, with case-sensitive
  matching and dotfiles enabled.
- Selected relative paths are sorted by code point and contain file bytes
  unchanged. Executable mode bits are not part of the plan.
- The descriptor is part of the source tree and follows the same selection
  patterns. Exclude `deesse-template.json` when it should not appear in the
  generated project.
- Empty selections, invalid patterns, unsafe paths, selected symlinks, and
  source or descriptor errors return structured diagnostics.
- GitHub reads are limited to 10,000 inventory entries, 10 MiB per file, and
  50 MiB total selected bytes. Requests time out and retry transient failures.

The GitHub adapter reads public repositories through the GitHub REST API. A
different provider can implement `TemplateSourceAdapter` and return the same
immutable snapshot contract.
