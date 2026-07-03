---
name: reference-giget-cli-patterns
description: unjs giget API surface for the DeesseJS init CLI; provider list, cache, auth, install flag, ignore patterns
metadata:
  type: reference
---

Researched 2026-07-02 via `fresh` CLI against `unjs/giget` `main`. Source: `documents/internal/architecture/12-apps/cli/decisions/0001-giget-as-fetch-primitive.md`.

## Why giget

The de facto standard for "download a template from a remote source" in 2026. Used by Nuxt, Astro, Volt, and ~30 other tools. Zero-dep itself. Maintained by the unjs org.

## Source string format

```ts
// GitHub
"gh:owner/repo"
"github:owner/repo"
"github:owner/repo#branch"
"github:owner/repo/path#branch"  // sparse subdir extraction

// GitLab, Bitbucket, Sourcehut
"gitlab:group/project"
"bitbucket:owner/repo"
"sourcehut:user/repo"

// GitLab subgroups need ::
"gitlab:group/subgroup/project"
"gitlab:group/subgroup/project::src/template"

// Raw tarball URL
"https://api.github.com/repos/owner/repo/tarball/main"

// Bare name → resolved via the registry
"starter"  // looks up templates/starter.json
```

## Programmatic API

```ts
import { downloadTemplate } from 'giget'

const { dir, source } = await downloadTemplate(input, {
  provider?: string                  // 'github' | 'gitlab' | 'bitbucket' | 'sourcehut' | 'git' | custom
  force?: boolean                    // extract to existing dir even if non-empty
  forceClean?: boolean               // remove existing dir first
  offline?: boolean                  // never download; use cache only
  preferOffline?: boolean            // use cache if present, else download
  providers?: Record<string, TemplateProvider>  // custom providers
  dir?: string                       // destination subdir
  registry?: false | string          // custom registry URL or `false` to disable
  cwd?: string
  auth?: string                      // Bearer token, overrides GIGET_AUTH env var
  install?: boolean | InstallOptions // post-extract install via nypm
  silent?: boolean
  ignore?: ((path: string) => boolean) | string[]   // glob patterns (Node ≥ 22.5 / 20.17)
})
```

## Cache location

`~/.cache/giget/<provider>/<template-name>/<version-or-name>.tar.gz`

- Auto-created on first download
- Reused on `--prefer-offline` (default flag in our CLI)
- Bypassed on `--offline` only if cache missing → error
- Bypassed on default behavior (always download)

## Auth

- `GIGET_AUTH` env var → sent as `Authorization: Bearer <token>` to all providers
- `auth` option → same, programmatic
- Works for private repos on GitHub, GitLab, etc.

## Install flag

If `install: true`, giget calls `nypm` to install deps after extraction. The DeesseJS CLI sets this to `false` and calls `nypm` itself for better error handling.

## Ignore patterns

```ts
ignore: ["pnpm-lock.yaml", "*.lock"]   // array of glob patterns
ignore: (path) => path === "pnpm-lock.yaml"  // callback
```

Requires Node ≥ 22.5 or 20.17. Useful for skipping template lockfiles (let the user generate their own).

## Registry format (custom catalog)

A JSON endpoint at `<base>/:template.json` returning:

```json
{
  "name": "starter",
  "tar": "https://codeload.github.com/owner/repo/tar.gz/main",
  "defaultDir": "deessejs-starter",
  "url": "https://github.com/owner/repo",
  "subdir": "templates/starter",
  "headers": {}
}
```

The DeesseJS CLI ships `templates/*.json` files in its repo as a local registry (no HTTP server needed).

## Error cases to handle

| Giget error | User-facing message |
|---|---|
| 404 from provider | Template "{name}" not found. Check the URL or branch. |
| Network failure + no cache | Could not download. Check connection or use --offline. |
| Corrupted tarball | Template tarball is corrupted. Try again. |
| `Unsupported provider` | Template URL uses an unsupported provider. |
| Tarball not found (offline mode) | Tarball not found: {path} (offline: true) |
| Destination exists + not `force` | Destination {path} already exists. |

## Sources

- [unjs/giget GitHub](https://github.com/unjs/giget) — canonical
- [Nuxt nuxi init](https://github.com/nuxt/cli/blob/main/packages/nuxi/src/commands/init.ts) — reference usage
- [Astro create-astro](https://github.com/withastro/astro/blob/main/packages/create-astro/src/actions/template.ts) — reference usage with `@bluwy/giget-core` fork
