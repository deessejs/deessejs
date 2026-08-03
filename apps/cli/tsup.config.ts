import { defineConfig } from "tsup"

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
})