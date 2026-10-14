import { createRequire } from "node:module"
import { defineConfig } from "tsup"

// Resolved at build time, inlined into the bundle as a string literal
// by esbuild's `define`. The CLI's `process.env.CLI_PACKAGE_VERSION`
// reference is replaced with the actual version from
// apps/cli/package.json before the bundle ships.
//
// We use createRequire instead of `import pkg from "./package.json"
// with { type: "json" }` to keep the config compatible with every
// tsup/esbuild version in the matrix, including the older ones that
// predate import attributes. This is a build-time read; the runtime
// never executes it.
const require = createRequire(import.meta.url)
const pkg = require("./package.json") as { version: string }

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  outExtension: () => ({ js: ".js" }),
  banner: {
    js: "#!/usr/bin/env node",
  },
  clean: true,
  minify: false,
  sourcemap: true,
  splitting: false,
  shims: false,
  treeshake: true,
  // `dts` is *deliberately* disabled. tsup 8.5.1's dts
  // worker re-evaluates the source for the .d.ts emit pass
  // and runs an inferred-type-naming check on every exported
  // const. With Better Auth 1.7.7, the literal type of
  // `cliAuthClientOptions` in `better-auth-client.ts`
  // transitively references `zod/v4/core` types (`$ZodType`,
  // `$ZodTypeInternals`, `$strip`) and `better-call` types
  // (`Issue`). The workspace pins `zod@4.4.3` while Better
  // Auth's transitive `@better-auth/core` pulls `zod@4.6.5`;
  // both versions coexist in the pnpm store, so TypeScript
  // can't name the inferred return through the union, and
  // the dts worker emits TS2883.
  //
  // tsup 8.5.1's `dts` config has no `noCheck` option, and
  // the standalone `tsc --emitDeclarationOnly` pass hits
  // the same wall (TS2883 fires whenever `.d.ts` emission
  // requires naming an inferred type). The only escape
  // hatches are (a) deduplicating Zod in the workspace (out
  // of scope for this PR — see AGENTS.md on staging-first
  // scope discipline) and (b) skipping the dts pass entirely.
  //
  // We take (b). The CLI is a published binary, not a
  // library: `grep` for `@deessejs/cli` shows zero internal
  // `import { … } from "@deessejs/cli"` call sites (only
  // markdown doc snippets reference the package by name).
  // The `types` field is removed from `apps/cli/package.json`
  // in the same commit; consumers should treat
  // `@deessejs/cli` as a CLI entrypoint (`npx @deessejs/cli …`),
  // not a library. Runtime type-checking is unchanged:
  // `apps/cli#typecheck` (`tsc --noEmit`) runs in CI before
  // this build and still validates every source file.
  //
  // Tracking the upstream fix:
  //   https://github.com/better-auth/better-auth/issues/4250
  // When that issue closes, this can be reverted and
  // `dts: true` re-enabled with the same generic-typed cast
  // pattern used on the server side (see
  // `packages/auth/src/auth.ts`'s `auth` export).
  dts: false,
  // Bundle workspace-only packages into the published tarball so that
  // `npm install @deessejs/cli@1.1.2` does not try to resolve them from
  // the public npm registry (where they don't exist — 404 on install).
  // `@workspace/contracts` is the Zod schema shared by server, CLI, and
  // web; it's safe to bundle because it's tiny and rarely changes.
  // See PR that introduced this for the trade-off analysis.
  noExternal: [/^@workspace\//],
  define: {
    "process.env.CLI_PACKAGE_VERSION": JSON.stringify(pkg.version),
  },
})
