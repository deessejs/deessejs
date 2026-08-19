import { createRequire } from "node:module"
import { defineConfig } from "tsup"

// Resolved at build time, inlined into the bundle as a string literal
// by esbuild's `define`. The CLI's `process.env.CLI_PACKAGE_VERSION`
// reference is replaced with the actual version from
// apps/cli/package.json before the bundle ships. See ADR-019.
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
  dts: true,
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
