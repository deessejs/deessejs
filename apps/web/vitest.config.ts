import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"
import { vitestConfig } from "@workspace/vitest-config"

// Unit tests for the marketing site live at `tests/unit/**/*.test.ts`
// (plural root). The shared preset default
// `["tests/**/*.test.ts"]` (see `packages/vitest-config`) matches
// this layout, so we do not override `include` here.
//
// Playwright e2e suites live at `tests/e2e/**/*.spec.ts` and are
// picked up by the Playwright runner via `apps/web/playwright.config.ts`'s
// `testDir`. Vitest ignores them because the `.spec.ts` extension
// is not in its include glob.
//
// We deliberately do not include `src/**/*.test.ts` so a future
// contributor who drops a colocated `.test.ts` next to source
// does not accidentally have it picked up by vitest.
const shared = vitestConfig()

export default defineConfig({
  ...shared,
  resolve: {
    alias: {
      // The `@/*` alias is declared in `tsconfig.json`. Vite does not
      // read tsconfig paths on its own, so it is declared here, the
      // same way `apps/app` does it.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` is a marker, not a path alias. Next.js
      // implements it at the compiler level and the package itself is
      // not a dependency of this workspace, so a plain Node test
      // runner cannot resolve the import. It has no runtime
      // behaviour outside a React Server Component graph, so the
      // tests point it at an empty module. Same as `apps/app`.
      "server-only": fileURLToPath(
        new URL("./tests/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    ...(shared.test ?? {}),
    // The fetch wrapper translation has no env/server-side
    // setup needs; the shared `setupFiles: ["@workspace/env/server"]`
    // would pull in postgres / auth, which the client bundle
    // specifically avoids (see JSDoc on `apps/web/src/lib/orpc.ts`).
    setupFiles: [],
  },
})
