import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"
import { vitestConfig } from "@workspace/vitest-config"

const shared = vitestConfig()

// `apps/app` resolves its own modules through the `@/*` path alias
// declared in `tsconfig.json`. Vite does not read `tsconfig.json`
// paths on its own, so the alias is declared here explicitly rather
// than pulled in through a plugin: the app has exactly one alias and
// one that points at its own root, which is not worth a dependency.
//
// `server-only` is the second alias, and it is not a path alias. The
// marker is implemented by Next.js at the compiler level and the
// package itself is not a dependency of this workspace, so a plain
// Node test runner cannot resolve the import. The marker has no
// runtime behaviour outside a React Server Component graph, so the
// tests point it at an empty module.
export default defineConfig({
  ...shared,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./tests/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
})
