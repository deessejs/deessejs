import { defineConfig } from "vitest/config"
import { vitestConfig } from "@workspace/vitest-config"

// Unit tests for the marketing site. Today there is exactly one
// suite (the oRPC fetch wrapper translation) — keep this minimal
// until more tests need to live here. See ./test/unit/orpc.test.ts
// for the contract being pinned.
//
// Mirrors the apps convention used by `apps/cli/test/` (note the
// singular `test/` at the app level, in contrast to the plural
// `tests/` used inside `packages/*`). Including only `src/**/*.test.ts`
// would re-pick up colocated test files if anyone adds a `.test.ts`
// next to a source file later; we exclude them deliberately so the
// test folder is the single, predictable entry point.
const shared = vitestConfig({
  include: ["test/**/*.test.ts"],
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
