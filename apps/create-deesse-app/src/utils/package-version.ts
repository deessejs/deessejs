// Why we use tsup's `define` instead of `import pkg from "../package.json"`:
//
// Three options were considered for reading this package's version at
// runtime, all of which work for a plain Node script:
//
//   1. `import pkg from "../package.json" with { type: "json" }` —
//      works in Node 20+ thanks to import attributes. But tsup bundles
//      the CLI into a single ESM file and does NOT inline JSON imports
//      the way it inlines the `define` substitution. The bundled
//      binary would still try to resolve the relative path at runtime
//      and fail in a published npm tarball (the source path is gone).
//
//   2. `createRequire(import.meta.url)("../package.json")` — same
//      problem: the relative path is meaningless after bundling.
//
//   3. `process.env.PKG_VERSION` inlined at build time via tsup's
//      `define` (this file's approach). Esbuild performs a literal
//      string substitution at build time, so the bundle contains the
//      version as a string literal. No runtime resolution needed.
//      This is the pattern pnpm, vite, codama, and the wider
//      TypeScript-ecosystem CLI tooling converge on.
//
// The local `declare const process` block tells TypeScript about the
// extra env field. The same pattern lives in
// apps/cli/src/api/self-version.ts.
declare const process: {
  env: {
    CREATE_DEESSE_APP_VERSION?: string
  }
}

const FALLBACK = "0.0.0"

/**
 * Read the package version, as injected by the bundler at build time
 * (or the test runner at test time). The fallback "0.0.0" is only used
 * if both injection mechanisms ever fail to substitute — never in
 * shipped binaries. The drift-guard test
 * (test/unit/package-version.test.ts) catches a configuration
 * regression where tsup stops substituting.
 */
export const readPackageVersion = (): string => {
  return process.env.CREATE_DEESSE_APP_VERSION ?? FALLBACK
}
