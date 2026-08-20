import { defineConfig } from "vitest/config"
import { vitestConfig } from "@workspace/vitest-config"

// Unit tests for the marketing site. The vitest config accepts
// two folders:
//
//   - `test/**/*.test.ts`  (singular) — vitest unit tests,
//     including the PR #85 suite at `test/unit/orpc.test.ts`.
//   - `tests/**/*.test.ts` (plural)   — vitest unit tests under
//     the same convention as `packages/*`. Today no such tests
//     exist, but the convention is locked in by ADR-020 for
//     future unit-test suites.
//
// Playwright e2e suites live at `tests/e2e/**/*.spec.ts`. They
// are NOT picked up by vitest because the `.spec.ts` extension
// is excluded from the include globs above. The Playwright
// runner has its own config at `apps/web/playwright.config.ts`
// with its own `testDir`.
//
// We deliberately do not include `src/**/*.test.ts` so a future
// contributor who drops a colocated `.test.ts` next to source
// does not accidentally have it picked up by vitest. The two
// folders above are the single, predictable entry points.
const shared = vitestConfig({
  include: ["test/**/*.test.ts", "tests/**/*.test.ts"],
})

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
