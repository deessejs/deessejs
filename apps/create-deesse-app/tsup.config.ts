import { createRequire } from "node:module"
import { defineConfig } from "tsup"

// Resolved at build time, inlined into the bundle as a string literal
// by esbuild's `define`. The CLI's `process.env.CREATE_DEESSE_APP_VERSION`
// reference is replaced with the actual version from
// apps/create-deesse-app/package.json before the bundle ships.
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
  target: "node20",
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
  dts: false,
  noExternal: [/^@workspace\//],
  define: {
    "process.env.CREATE_DEESSE_APP_VERSION": JSON.stringify(packageVersion),
  },
})
