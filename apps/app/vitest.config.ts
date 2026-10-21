import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"
import { vitestConfig } from "@workspace/vitest-config"

const shared = vitestConfig()

// `apps/app` resolves its own modules through the `@/*` path alias
// declared in `tsconfig.json`. Vite does not read `tsconfig.json`
// paths on its own, so the alias is declared here explicitly rather
// than pulled in through a plugin: the app has exactly one alias and
// one that points at its own root, which is not worth a dependency.
export default defineConfig({
  ...shared,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
})
