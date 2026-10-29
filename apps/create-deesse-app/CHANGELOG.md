# create-deesse-app

## 0.1.0

### Minor Changes

- 2e4fd12: Add the first working pnpm-only initializer for the DeesseJS template. Resolves the current commit of `deessejs/saas-template` at runtime, downloads the tarball by SHA, validates and extracts it safely in two passes, rewrites only the root `package.json` name, and runs `pnpm install` (or `--no-install`). npm / npx invocation is detected and rejected before any destination mutation.
- 6d7441d: Add `--verbose` flag for human-readable pipeline progress on stderr (one line per step boundary, no JSON or exit-code change). Add a dedicated `aborted` error code on the cancel path with a launcher-agnostic re-run recovery. Forward `SIGINT` to the install child so cancel-during-install is reported as `aborted` (with `projectCreated: true` and the install recovery) rather than `install_failed`. Prereq-failure after publish now reports `projectCreated: true` with the no-install recovery, so the JSON truthfully describes the on-disk state.

### Patch Changes

- 35aa5eb: Generate Windows install recovery commands for PowerShell and quote every argument using PowerShell literal-string rules.
