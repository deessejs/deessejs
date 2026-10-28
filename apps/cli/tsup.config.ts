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
const packageJson: unknown = require("./package.json")
const packageVersion =
  typeof packageJson === "object" &&
  packageJson !== null &&
  "version" in packageJson &&
  typeof packageJson.version === "string"
    ? packageJson.version
    : (() => {
        throw new Error("package.json must contain a string version")
      })()

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
  // `dts` is *deliberately* disabled. With Better Auth 1.7.7, the
  // inferred return type of `createAuthClient({...})` in
  // `better-auth-client.ts` transitively references types from
  // `zod/v4/core` and `better-call` that do not unify across the
  // workspace's two resolved zod versions. The tsup `.d.ts` worker
  // emits TS2883 on those exports. The standalone `tsc
  // --emitDeclarationOnly` pass hits the same wall, and tsup 8.5.1's
  // `dts` config exposes no `noCheck` knob.
  //
  // Decision: ship the CLI as an executable-only package. There
  // are zero internal `import { … } from "@deessejs/cli"` call
  // sites (only markdown doc snippets reference the package by
  // name), so no consumer needs `.d.ts` for it. The `types` field
  // is removed from `apps/cli/package.json`. Runtime type-checking
  // is preserved: `apps/cli#typecheck` (`tsc --noEmit`) runs in CI
  // before this build and validates every source file.
  dts: false,
  // Bundle workspace-only packages into the published tarball so that
  // `npm install @deessejs/cli@1.1.2` does not try to resolve them from
  // the public npm registry (where they don't exist — 404 on install).
  // Workspace packages are bundled so the published CLI does not depend on
  // private packages that are unavailable from the public npm registry.
  // The registry's runtime dependencies are bundled for the same reason:
  // they are reached through its source and are not CLI runtime dependencies.
  noExternal: [/^@workspace\//, /^picomatch$/, /^tar$/, /^zod$/],
  define: {
    "process.env.CLI_PACKAGE_VERSION": JSON.stringify(packageVersion),
  },
})
