import { defineConfig } from "vitest/config"
import { vitestConfig } from "@workspace/vitest-config"

// Unit tests for the marketing site live at `tests/unit/**/*.test.ts`
// (plural root, per ADR-020). The shared preset default
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
  test: {
    ...(shared.test ?? {}),
    // The fetch wrapper translation has no env/server-side
    // setup needs; the shared `setupFiles: ["@workspace/env/server"]`
    // would pull in postgres / auth, which the client bundle
    // specifically avoids (see JSDoc on `apps/web/src/lib/orpc.ts`).
    setupFiles: [],
  },
})
