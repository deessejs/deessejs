---
"create-deesse-app": minor
---

Add the first working pnpm-only initializer for the DeesseJS template. Resolves the current commit of `deessejs/saas-template` at runtime, downloads the tarball by SHA, validates and extracts it safely in two passes, rewrites only the root `package.json` name, and runs `pnpm install` (or `--no-install`). npm / npx invocation is detected and rejected before any destination mutation.